import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import {
  buildLocalizedProductTextPayload,
  ensureUniqueSlug,
  normalizeProductDetailSectionsInput,
  normalizeProductLocalizedText,
  resolveLocalizedProductText,
  serializeProduct,
} from '#modula/server/utils/shop'
import { getShopDefaultVatRate, normalizeStripeTaxBehavior, normalizeStripeTaxCode, normalizeVatRate } from '#modula/server/utils/settings'
import { normalizeRentalConfig } from '#modula/server/services/shop/rentalConfig'
import { isStripeConfigured } from '#modula/server/services/payment/paymentService'
import type { CmsLocalizedText } from '#modula/shared/cms'

interface Body {
  name?: string
  nameLocalized?: CmsLocalizedText | null
  slug?: string
  saleType?: 'SALE' | 'RENTAL'
  categoryId?: number | null
  excerpt?: string | null
  excerptLocalized?: CmsLocalizedText | null
  description?: string | null
  descriptionLocalized?: CmsLocalizedText | null
  detailSections?: unknown
  imageUrl?: string | null
  price?: number
  vatRate?: number
  paymentTaxCode?: string | null
  paymentTaxBehavior?: 'inclusive' | 'exclusive' | null
  stock?: number
  rentalAvailableFrom?: string | null
  rentalAvailableTo?: string | null
  rentalMinDays?: number | null
  rentalMaxDays?: number | null
  rentalBookingMode?: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
  rentalApprovalMode?: 'AUTO' | 'MANUAL'
  rentalHourlyPrice?: number | null
  rentalDailyPrice?: number | null
  rentalDurations?: number[]
  rentalSlotStepMinutes?: number
  unitLabel?: string | null
  unitLabelLocalized?: CmsLocalizedText | null
  allowOfflinePayment?: boolean
  allowOnlinePayment?: boolean
  allowCustomerCancellation?: boolean
  allowRefundRequestAfterEngagement?: boolean
  active?: boolean
  position?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)
  const nameLocalized = normalizeProductLocalizedText(body.nameLocalized ?? body.name, body.name ?? '')
  const name = resolveLocalizedProductText(nameLocalized, '')

  if (!name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const excerptPayload = buildLocalizedProductTextPayload(body.excerptLocalized ?? body.excerpt, body.excerpt ?? '')
  const descriptionPayload = buildLocalizedProductTextPayload(body.descriptionLocalized ?? body.description, body.description ?? '')
  const unitLabelPayload = buildLocalizedProductTextPayload(body.unitLabelLocalized ?? body.unitLabel, body.unitLabel ?? '')

  const price = Number(body.price ?? 0)
  const rentalHourlyPrice = normalizeOptionalPrice(body.rentalHourlyPrice)
  const rentalDailyPrice = normalizeOptionalPrice(body.rentalDailyPrice)
  const shopDefaultVatRate = await getShopDefaultVatRate()
  const vatRate = normalizeVatRate(body.vatRate ?? shopDefaultVatRate, shopDefaultVatRate)
  const stock = Number(body.stock ?? 0)
  const rentalConfig = normalizeRentalConfig({
    rentalAvailableFrom: body.rentalAvailableFrom,
    rentalAvailableTo: body.rentalAvailableTo,
    rentalMinDays: body.rentalMinDays,
    rentalMaxDays: body.rentalMaxDays,
    rentalBookingMode: body.rentalBookingMode,
    rentalDurations: body.rentalDurations,
    rentalSlotStepMinutes: body.rentalSlotStepMinutes
  })
  const paymentTaxCode = normalizeStripeTaxCode(body.paymentTaxCode)
  const paymentTaxBehavior = body.paymentTaxBehavior == null
    ? null
    : normalizeStripeTaxBehavior(body.paymentTaxBehavior, 'inclusive')
  const allowOfflinePayment = body.allowOfflinePayment ?? true
  const allowOnlinePayment = body.allowOnlinePayment ?? false
  const allowCustomerCancellation = body.allowCustomerCancellation ?? true
  const allowRefundRequestAfterEngagement = body.allowRefundRequestAfterEngagement ?? false
  if (!Number.isFinite(price) || price < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Prix invalide' })
  }
  if (body.saleType === 'RENTAL') {
    if (rentalConfig.rentalBookingMode !== 'MULTI_DAY' && rentalHourlyPrice == null) {
      throw createError({ statusCode: 400, message: 'Le tarif horaire est requis' })
    }
    if (rentalConfig.rentalBookingMode !== 'SINGLE_DAY' && rentalDailyPrice == null) {
      throw createError({ statusCode: 400, message: 'Le tarif journalier est requis' })
    }
  }
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Taux de TVA invalide' })
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Stock invalide' })
  }
  if (allowOnlinePayment && !(await isStripeConfigured())) {
    throw createError({
      statusCode: 400,
      message: 'Le paiement en ligne doit être configuré et activé avant de pouvoir être autorisé sur un produit',
    })
  }
  if (!allowOfflinePayment && !allowOnlinePayment) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un mode de paiement doit être activé' })
  }

  const slug = await ensureUniqueSlug('product', body.slug?.trim() || name.trim())
  const categoryId = body.categoryId == null || Number(body.categoryId) <= 0 ? null : Number(body.categoryId)
  const detailsJson = JSON.stringify(normalizeProductDetailSectionsInput(body.detailSections))

  const row = await db.product.create({
    data: {
      name,
      nameJson: JSON.stringify(nameLocalized),
      slug,
      saleType: body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
      categoryId,
      excerpt: excerptPayload.text || null,
      excerptJson: excerptPayload.json,
      description: descriptionPayload.text || null,
      descriptionJson: descriptionPayload.json,
      detailsJson,
      imageUrl: body.imageUrl || null,
      price,
      vatRate,
      paymentTaxCode: paymentTaxCode || null,
      paymentTaxBehavior,
      stock,
      rentalAvailableFrom: rentalConfig.rentalAvailableFrom,
      rentalAvailableTo: rentalConfig.rentalAvailableTo,
      rentalMinDays: rentalConfig.rentalMinDays,
      rentalMaxDays: rentalConfig.rentalMaxDays,
      rentalBookingMode: rentalConfig.rentalBookingMode,
      rentalApprovalMode: body.rentalApprovalMode === 'MANUAL' ? 'MANUAL' : 'AUTO',
      rentalHourlyPrice,
      rentalDailyPrice,
      rentalDurationsJson: JSON.stringify(rentalConfig.rentalDurations),
      rentalSlotStepMinutes: rentalConfig.rentalSlotStepMinutes,
      unitLabel: unitLabelPayload.text || null,
      unitLabelJson: unitLabelPayload.json,
      allowOfflinePayment,
      allowOnlinePayment,
      allowCustomerCancellation,
      allowRefundRequestAfterEngagement,
      active: body.active ?? true,
      position: body.position ?? 0
    },
    include: {
      category: true
    }
  })

  return serializeProduct(row)
})

function normalizeOptionalPrice(value: unknown) {
  if (value == null || value === '') return null
  const price = Number(value)
  if (!Number.isFinite(price) || price < 0) {
    throw createError({ statusCode: 400, message: 'Tarif de location invalide' })
  }
  return price
}
