import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'
import {
  buildLocalizedProductTextPayload,
  ensureUniqueSlug,
  normalizeProductDetailSectionsInput,
  normalizeProductLocalizedText,
  resolveLocalizedProductText,
  serializeProduct,
} from '#modula/server/utils/shop'
import { normalizeStripeTaxBehavior, normalizeStripeTaxCode, normalizeVatRate } from '#modula/server/utils/settings'
import { normalizeRentalConfig } from '#modula/server/services/shop/rentalConfig'
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
  unitLabel?: string | null
  unitLabelLocalized?: CmsLocalizedText | null
  allowOfflinePayment?: boolean
  allowOnlinePayment?: boolean
  active?: boolean
  position?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  const body = await readBody<Body>(event)
  const data: Record<string, any> = {}
  const nextSaleType = body.saleType === undefined
    ? (existing.saleType === 'RENTAL' ? 'RENTAL' : 'SALE')
    : (body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE')
  const rentalConfig = normalizeRentalConfig({
    rentalAvailableFrom: nextSaleType === 'RENTAL' ? (body.rentalAvailableFrom ?? existing.rentalAvailableFrom) : null,
    rentalAvailableTo: nextSaleType === 'RENTAL' ? (body.rentalAvailableTo ?? existing.rentalAvailableTo) : null,
    rentalMinDays: nextSaleType === 'RENTAL' ? (body.rentalMinDays ?? existing.rentalMinDays) : 1,
    rentalMaxDays: nextSaleType === 'RENTAL' ? (body.rentalMaxDays ?? existing.rentalMaxDays) : null
  })

  if (body.name !== undefined || body.nameLocalized !== undefined) {
    const nameLocalized = normalizeProductLocalizedText(body.nameLocalized ?? body.name, body.name ?? existing.name ?? '')
    data.name = resolveLocalizedProductText(nameLocalized, String(existing.name || ''))
    data.nameJson = JSON.stringify(nameLocalized)
  }
  if (body.excerpt !== undefined || body.excerptLocalized !== undefined) {
    const excerptPayload = buildLocalizedProductTextPayload(body.excerptLocalized ?? body.excerpt, body.excerpt ?? existing.excerpt ?? '')
    data.excerpt = excerptPayload.text || null
    data.excerptJson = excerptPayload.json
  }
  if (body.description !== undefined || body.descriptionLocalized !== undefined) {
    const descriptionPayload = buildLocalizedProductTextPayload(body.descriptionLocalized ?? body.description, body.description ?? existing.description ?? '')
    data.description = descriptionPayload.text || null
    data.descriptionJson = descriptionPayload.json
  }
  if (body.detailSections !== undefined) data.detailsJson = JSON.stringify(normalizeProductDetailSectionsInput(body.detailSections))
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
  if (body.unitLabel !== undefined || body.unitLabelLocalized !== undefined) {
    const unitLabelPayload = buildLocalizedProductTextPayload(body.unitLabelLocalized ?? body.unitLabel, body.unitLabel ?? existing.unitLabel ?? '')
    data.unitLabel = unitLabelPayload.text || null
    data.unitLabelJson = unitLabelPayload.json
  }
  if (body.saleType !== undefined) data.saleType = nextSaleType
  if (body.categoryId !== undefined) data.categoryId = body.categoryId == null || Number(body.categoryId) <= 0 ? null : Number(body.categoryId)
  const effectiveAllowOfflinePayment = body.allowOfflinePayment !== undefined ? Boolean(body.allowOfflinePayment) : Boolean(existing.allowOfflinePayment)
  const effectiveAllowOnlinePayment = body.allowOnlinePayment !== undefined ? Boolean(body.allowOnlinePayment) : Boolean(existing.allowOnlinePayment)
  if (!effectiveAllowOfflinePayment && !effectiveAllowOnlinePayment) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un mode de paiement doit être activé' })
  }
  if (body.allowOfflinePayment !== undefined) data.allowOfflinePayment = effectiveAllowOfflinePayment
  if (body.allowOnlinePayment !== undefined) data.allowOnlinePayment = effectiveAllowOnlinePayment
  if (body.active !== undefined) data.active = body.active
  if (body.position !== undefined) data.position = body.position
  if (body.price !== undefined) {
    const price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Prix invalide' })
    }
    data.price = price
  }
  if (body.vatRate !== undefined) {
    const vatRate = Number(body.vatRate)
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      throw createError({ statusCode: 400, statusMessage: 'Taux de TVA invalide' })
    }
    data.vatRate = normalizeVatRate(vatRate, Number(existing.vatRate || 20))
  }
  if (body.paymentTaxCode !== undefined) {
    data.paymentTaxCode = normalizeStripeTaxCode(body.paymentTaxCode) || null
  }
  if (body.paymentTaxBehavior !== undefined) {
    data.paymentTaxBehavior = body.paymentTaxBehavior == null
      ? null
      : normalizeStripeTaxBehavior(body.paymentTaxBehavior, existing.paymentTaxBehavior === 'exclusive' ? 'exclusive' : 'inclusive')
  }
  if (body.stock !== undefined) {
    const stock = Number(body.stock)
    if (!Number.isInteger(stock) || stock < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Stock invalide' })
    }
    data.stock = stock
  }
  if (nextSaleType === 'RENTAL') {
    if (body.rentalAvailableFrom !== undefined || body.saleType !== undefined) data.rentalAvailableFrom = rentalConfig.rentalAvailableFrom
    if (body.rentalAvailableTo !== undefined || body.saleType !== undefined) data.rentalAvailableTo = rentalConfig.rentalAvailableTo
    if (body.rentalMinDays !== undefined || body.saleType !== undefined) data.rentalMinDays = rentalConfig.rentalMinDays
    if (body.rentalMaxDays !== undefined || body.saleType !== undefined) data.rentalMaxDays = rentalConfig.rentalMaxDays
  } else if (body.saleType !== undefined) {
    data.rentalAvailableFrom = null
    data.rentalAvailableTo = null
    data.rentalMinDays = 1
    data.rentalMaxDays = null
  }

  if (body.slug !== undefined || body.name !== undefined) {
    const localizedName = body.nameLocalized !== undefined
      ? resolveLocalizedProductText(normalizeProductLocalizedText(body.nameLocalized, body.name ?? existing.name ?? ''), existing.name ?? '')
      : existing.name
    data.slug = await ensureUniqueSlug('product', body.slug?.trim() || body.name?.trim() || localizedName || existing.slug, id)
  }

  const row = await db.product.update({
    where: { id },
    data,
    include: {
      category: true
    }
  })

  await syncImageUsageTable()
  return serializeProduct(row)
})
