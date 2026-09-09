import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import {
  buildLocalizedProductTextPayload,
  ensureUniqueSlug,
  normalizeProductDetailSectionsInput,
  normalizeProductLocalizedText,
  resolveLocalizedProductText,
  promoteProductOptionGroups,
  serializeProduct,
} from '#modula/server/utils/shop'
import { getShopDefaultVatRate, normalizeStripeTaxBehavior, normalizeStripeTaxCode, normalizeVatRate } from '#modula/server/utils/settings'
import { normalizeRentalConfig } from '#modula/server/services/shop/rentalConfig'
import { isStripeConfigured } from '#modula/server/services/payment/paymentService'
import type { CmsLocalizedText } from '#modula/shared/cms'
import { normalizeProductOptionGroups, normalizeProductOptionOverrides } from '#modula/shared/productOptions'
import { isRentalLateFeeMode, type RentalLateFeeMode } from '#modula/shared/rentalLateFees'
import { normalizeRentalRates } from '#modula/shared/rentalRates'

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
  optionGroups?: unknown
  excludedOptionSetIds?: number[]
  optionOverrides?: unknown
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
  rentalPricingStrategy?: 'LINEAR' | 'GRID'
  rentalRates?: unknown
  rentalDurations?: number[]
  rentalSlotStepMinutes?: number
  rentalDepositAmount?: number | null
  rentalDepositAllowOnsitePayment?: boolean
  rentalDepositAllowOnlinePayment?: boolean
  rentalLateFeeEnabled?: boolean
  rentalLateFeeMode?: RentalLateFeeMode
  rentalLateFeeAmount?: number | null
  rentalLateFeeMultiplier?: number | null
  rentalLateFeeGraceMinutes?: number
  rentalLateFeeMinimum?: number | null
  rentalLateFeeMaximum?: number | null
  rentalLateFeeVatRate?: number | null
  unitLabel?: string | null
  unitLabelLocalized?: CmsLocalizedText | null
  allowOfflinePayment?: boolean
  allowOnlinePayment?: boolean
  allowCustomerCancellation?: boolean
  allowRefundRequestAfterEngagement?: boolean
  active?: boolean
  catalogVisible?: boolean
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
  const rentalDepositAmount = normalizeOptionalPrice(body.rentalDepositAmount)
  const rentalDepositAllowOnsitePayment = body.rentalDepositAllowOnsitePayment ?? true
  const rentalDepositAllowOnlinePayment = body.rentalDepositAllowOnlinePayment ?? false
  const rentalLateFeeEnabled = body.saleType === 'RENTAL' && Boolean(body.rentalLateFeeEnabled)
  const rentalLateFeeMode = isRentalLateFeeMode(body.rentalLateFeeMode) ? body.rentalLateFeeMode : 'PER_HOUR_STARTED'
  const rentalLateFeeAmount = normalizeOptionalPrice(body.rentalLateFeeAmount)
  const rentalLateFeeMultiplier = normalizeOptionalPrice(body.rentalLateFeeMultiplier)
  const rentalLateFeeGraceMinutes = normalizeNonNegativeInteger(body.rentalLateFeeGraceMinutes)
  const rentalLateFeeMinimum = normalizeOptionalPrice(body.rentalLateFeeMinimum)
  const rentalLateFeeMaximum = normalizeOptionalPrice(body.rentalLateFeeMaximum)
  const rentalLateFeeVatRate = body.rentalLateFeeVatRate == null ? null : normalizeVatRate(body.rentalLateFeeVatRate, vatRate)
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
  if (rentalDepositAmount != null && rentalDepositAmount > 0) {
    if (!rentalDepositAllowOnsitePayment && !rentalDepositAllowOnlinePayment) {
      throw createError({ statusCode: 400, message: 'Au moins un mode de versement du dépôt de garantie doit être activé' })
    }
    if (rentalDepositAllowOnlinePayment && !(await isStripeConfigured())) {
      throw createError({ statusCode: 400, message: 'Le versement en ligne du dépôt de garantie nécessite un fournisseur de paiement configuré' })
    }
  }
  validateLateFeeConfig({
    enabled: rentalLateFeeEnabled,
    mode: rentalLateFeeMode,
    amount: rentalLateFeeAmount,
    multiplier: rentalLateFeeMultiplier,
    minimum: rentalLateFeeMinimum,
    maximum: rentalLateFeeMaximum,
    hourlyPrice: rentalHourlyPrice,
    dailyPrice: rentalDailyPrice,
  })
  if (!allowOfflinePayment && !allowOnlinePayment) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un mode de paiement doit être activé' })
  }

  const slug = await ensureUniqueSlug('product', body.slug?.trim() || name.trim())
  const categoryId = body.categoryId == null || Number(body.categoryId) <= 0 ? null : Number(body.categoryId)
  const detailsJson = JSON.stringify(normalizeProductDetailSectionsInput(body.detailSections))
  const optionGroups = normalizeProductOptionGroups(body.optionGroups)
  const optionGroupsJson = JSON.stringify(optionGroups)

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
      optionGroupsJson,
      excludedOptionSetIdsJson: JSON.stringify(normalizeIdList(body.excludedOptionSetIds)),
      optionOverridesJson: JSON.stringify(normalizeProductOptionOverrides(body.optionOverrides)),
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
      rentalPricingStrategy: body.rentalPricingStrategy === 'GRID' ? 'GRID' : 'LINEAR',
      rentalRatesJson: JSON.stringify(normalizeRentalRates(body.rentalRates)),
      rentalDurationsJson: JSON.stringify(rentalConfig.rentalDurations),
      rentalSlotStepMinutes: rentalConfig.rentalSlotStepMinutes,
      rentalDepositAmount: body.saleType === 'RENTAL' ? rentalDepositAmount : null,
      rentalDepositAllowOnsitePayment: body.saleType === 'RENTAL' ? rentalDepositAllowOnsitePayment : true,
      rentalDepositAllowOnlinePayment: body.saleType === 'RENTAL' ? rentalDepositAllowOnlinePayment : false,
      rentalLateFeeEnabled,
      rentalLateFeeMode,
      rentalLateFeeAmount: body.saleType === 'RENTAL' ? rentalLateFeeAmount : null,
      rentalLateFeeMultiplier: body.saleType === 'RENTAL' ? rentalLateFeeMultiplier : null,
      rentalLateFeeGraceMinutes: body.saleType === 'RENTAL' ? rentalLateFeeGraceMinutes : 0,
      rentalLateFeeMinimum: body.saleType === 'RENTAL' ? rentalLateFeeMinimum : null,
      rentalLateFeeMaximum: body.saleType === 'RENTAL' ? rentalLateFeeMaximum : null,
      rentalLateFeeVatRate: body.saleType === 'RENTAL' ? rentalLateFeeVatRate : null,
      unitLabel: unitLabelPayload.text || null,
      unitLabelJson: unitLabelPayload.json,
      allowOfflinePayment,
      allowOnlinePayment,
      allowCustomerCancellation,
      allowRefundRequestAfterEngagement,
      active: body.active ?? true,
      catalogVisible: body.catalogVisible ?? true,
      position: body.position ?? 0
    },
    include: {
      category: true
    }
  })

  if (optionGroups.length) {
    await promoteProductOptionGroups(Number(row.id), body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE', optionGroups)
    const promotedRow = await db.product.findUnique({ where: { id: Number(row.id) }, include: { category: true } })
    return serializeProduct(promotedRow || row)
  }

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

function normalizeNonNegativeInteger(value: unknown) {
  const number = Number(value ?? 0)
  if (!Number.isInteger(number) || number < 0) {
    throw createError({ statusCode: 400, message: 'Le délai de grâce doit être un nombre entier positif' })
  }
  return number
}

function validateLateFeeConfig(config: {
  enabled: boolean
  mode: RentalLateFeeMode
  amount: number | null
  multiplier: number | null
  minimum: number | null
  maximum: number | null
  hourlyPrice: number | null
  dailyPrice: number | null
}) {
  if (!config.enabled) return
  if (config.minimum != null && config.maximum != null && config.minimum > config.maximum) {
    throw createError({ statusCode: 400, message: 'Le minimum des frais de retard ne peut pas dépasser le plafond' })
  }
  if (['FIXED', 'PER_HOUR_STARTED', 'PER_DAY_STARTED'].includes(config.mode) && !(Number(config.amount) > 0)) {
    throw createError({ statusCode: 400, message: 'Le montant des frais de retard est requis' })
  }
  if (config.mode.endsWith('_MULTIPLIER') && !(Number(config.multiplier) > 0)) {
    throw createError({ statusCode: 400, message: 'Le coefficient des frais de retard est requis' })
  }
  if (config.mode === 'HOURLY_MULTIPLIER' && !(Number(config.hourlyPrice) > 0)) {
    throw createError({ statusCode: 400, message: 'Un tarif horaire est requis pour calculer les frais de retard' })
  }
  if (config.mode === 'DAILY_MULTIPLIER' && !(Number(config.dailyPrice) > 0)) {
    throw createError({ statusCode: 400, message: 'Un tarif journalier est requis pour calculer les frais de retard' })
  }
}

function normalizeIdList(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map(Number).filter(entry => Number.isInteger(entry) && entry > 0)))
    : []
}
