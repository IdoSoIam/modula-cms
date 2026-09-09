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
import { normalizeStripeTaxBehavior, normalizeStripeTaxCode, normalizeVatRate } from '#modula/server/utils/settings'
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
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const existing = await db.product.findUnique({ where: { id } })
  if (!existing || existing.deletedAt) {
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
    rentalMaxDays: nextSaleType === 'RENTAL' ? (body.rentalMaxDays ?? existing.rentalMaxDays) : null,
    rentalBookingMode: nextSaleType === 'RENTAL' ? (body.rentalBookingMode ?? existing.rentalBookingMode) : 'MULTI_DAY',
    rentalDurations: nextSaleType === 'RENTAL' ? (body.rentalDurations ?? existing.rentalDurationsJson) : [60, 120, 240],
    rentalSlotStepMinutes: nextSaleType === 'RENTAL' ? (body.rentalSlotStepMinutes ?? existing.rentalSlotStepMinutes) : 30
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
  if (body.rentalPricingStrategy !== undefined) data.rentalPricingStrategy = body.rentalPricingStrategy === 'GRID' ? 'GRID' : 'LINEAR'
  if (body.rentalRates !== undefined) data.rentalRatesJson = JSON.stringify(normalizeRentalRates(body.rentalRates))
  const optionGroups = body.optionGroups === undefined ? [] : normalizeProductOptionGroups(body.optionGroups)
  if (body.optionGroups !== undefined) data.optionGroupsJson = JSON.stringify(optionGroups)
  if (body.excludedOptionSetIds !== undefined) data.excludedOptionSetIdsJson = JSON.stringify(normalizeIdList(body.excludedOptionSetIds))
  if (body.optionOverrides !== undefined) data.optionOverridesJson = JSON.stringify(normalizeProductOptionOverrides(body.optionOverrides))
  if (body.catalogVisible !== undefined) data.catalogVisible = Boolean(body.catalogVisible)
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
  if (body.allowOnlinePayment === true && !(await isStripeConfigured())) {
    throw createError({
      statusCode: 400,
      message: 'Le paiement en ligne doit être configuré et activé avant de pouvoir être autorisé sur un produit',
    })
  }
  if (!effectiveAllowOfflinePayment && !effectiveAllowOnlinePayment) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un mode de paiement doit être activé' })
  }
  if (body.allowOfflinePayment !== undefined) data.allowOfflinePayment = effectiveAllowOfflinePayment
  if (body.allowOnlinePayment !== undefined) data.allowOnlinePayment = effectiveAllowOnlinePayment
  if (body.allowCustomerCancellation !== undefined) data.allowCustomerCancellation = Boolean(body.allowCustomerCancellation)
  if (body.allowRefundRequestAfterEngagement !== undefined) data.allowRefundRequestAfterEngagement = Boolean(body.allowRefundRequestAfterEngagement)
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
    if (body.rentalAvailableFrom !== undefined) data.rentalAvailableFrom = rentalConfig.rentalAvailableFrom
    if (body.rentalAvailableTo !== undefined) data.rentalAvailableTo = rentalConfig.rentalAvailableTo
    if (body.rentalMinDays !== undefined) data.rentalMinDays = rentalConfig.rentalMinDays
    if (body.rentalMaxDays !== undefined) data.rentalMaxDays = rentalConfig.rentalMaxDays
    if (body.rentalBookingMode !== undefined) data.rentalBookingMode = rentalConfig.rentalBookingMode
    if (body.rentalApprovalMode !== undefined) data.rentalApprovalMode = body.rentalApprovalMode === 'MANUAL' ? 'MANUAL' : 'AUTO'
    if (body.rentalHourlyPrice !== undefined) data.rentalHourlyPrice = normalizeOptionalPrice(body.rentalHourlyPrice)
    if (body.rentalDailyPrice !== undefined) data.rentalDailyPrice = normalizeOptionalPrice(body.rentalDailyPrice)
    if (body.rentalDurations !== undefined) data.rentalDurationsJson = JSON.stringify(rentalConfig.rentalDurations)
    if (body.rentalSlotStepMinutes !== undefined) data.rentalSlotStepMinutes = rentalConfig.rentalSlotStepMinutes
    const rentalDepositAmount = body.rentalDepositAmount !== undefined
      ? normalizeOptionalPrice(body.rentalDepositAmount)
      : (existing.rentalDepositAmount == null ? null : Number(existing.rentalDepositAmount))
    const rentalDepositAllowOnsitePayment = body.rentalDepositAllowOnsitePayment !== undefined
      ? Boolean(body.rentalDepositAllowOnsitePayment)
      : Boolean(existing.rentalDepositAllowOnsitePayment)
    const rentalDepositAllowOnlinePayment = body.rentalDepositAllowOnlinePayment !== undefined
      ? Boolean(body.rentalDepositAllowOnlinePayment)
      : Boolean(existing.rentalDepositAllowOnlinePayment)
    if (rentalDepositAmount != null && rentalDepositAmount > 0) {
      if (!rentalDepositAllowOnsitePayment && !rentalDepositAllowOnlinePayment) {
        throw createError({ statusCode: 400, message: 'Au moins un mode de versement du dépôt de garantie doit être activé' })
      }
      if (rentalDepositAllowOnlinePayment && !(await isStripeConfigured())) {
        throw createError({ statusCode: 400, message: 'Le versement en ligne du dépôt de garantie nécessite un fournisseur de paiement configuré' })
      }
    }
    if (body.rentalDepositAmount !== undefined) data.rentalDepositAmount = rentalDepositAmount
    if (body.rentalDepositAllowOnsitePayment !== undefined) data.rentalDepositAllowOnsitePayment = rentalDepositAllowOnsitePayment
    if (body.rentalDepositAllowOnlinePayment !== undefined) data.rentalDepositAllowOnlinePayment = rentalDepositAllowOnlinePayment

    const hourlyPrice = body.rentalHourlyPrice !== undefined
      ? normalizeOptionalPrice(body.rentalHourlyPrice)
      : existing.rentalHourlyPrice ?? (existing.rentalBookingMode === 'SINGLE_DAY' ? existing.price : null)
    const dailyPrice = body.rentalDailyPrice !== undefined
      ? normalizeOptionalPrice(body.rentalDailyPrice)
      : existing.rentalDailyPrice ?? (existing.rentalBookingMode === 'MULTI_DAY' ? existing.price : null)
    const rentalLateFeeEnabled = body.rentalLateFeeEnabled === undefined ? Boolean(existing.rentalLateFeeEnabled) : Boolean(body.rentalLateFeeEnabled)
    const rentalLateFeeMode = body.rentalLateFeeMode === undefined
      ? (isRentalLateFeeMode(existing.rentalLateFeeMode) ? existing.rentalLateFeeMode : 'PER_HOUR_STARTED')
      : (isRentalLateFeeMode(body.rentalLateFeeMode) ? body.rentalLateFeeMode : 'PER_HOUR_STARTED')
    const rentalLateFeeAmount = body.rentalLateFeeAmount === undefined ? nullableNumber(existing.rentalLateFeeAmount) : normalizeOptionalPrice(body.rentalLateFeeAmount)
    const rentalLateFeeMultiplier = body.rentalLateFeeMultiplier === undefined ? nullableNumber(existing.rentalLateFeeMultiplier) : normalizeOptionalPrice(body.rentalLateFeeMultiplier)
    const rentalLateFeeGraceMinutes = body.rentalLateFeeGraceMinutes === undefined
      ? Math.max(0, Number(existing.rentalLateFeeGraceMinutes || 0))
      : normalizeNonNegativeInteger(body.rentalLateFeeGraceMinutes)
    const rentalLateFeeMinimum = body.rentalLateFeeMinimum === undefined ? nullableNumber(existing.rentalLateFeeMinimum) : normalizeOptionalPrice(body.rentalLateFeeMinimum)
    const rentalLateFeeMaximum = body.rentalLateFeeMaximum === undefined ? nullableNumber(existing.rentalLateFeeMaximum) : normalizeOptionalPrice(body.rentalLateFeeMaximum)
    const rentalLateFeeVatRate = body.rentalLateFeeVatRate === undefined
      ? nullableNumber(existing.rentalLateFeeVatRate)
      : body.rentalLateFeeVatRate == null
        ? null
        : normalizeVatRate(body.rentalLateFeeVatRate, Number(existing.vatRate || 20))
    validateLateFeeConfig({
      enabled: rentalLateFeeEnabled,
      mode: rentalLateFeeMode,
      amount: rentalLateFeeAmount,
      multiplier: rentalLateFeeMultiplier,
      minimum: rentalLateFeeMinimum,
      maximum: rentalLateFeeMaximum,
      hourlyPrice: hourlyPrice == null ? null : Number(hourlyPrice),
      dailyPrice: dailyPrice == null ? null : Number(dailyPrice),
    })
    if (body.rentalLateFeeEnabled !== undefined) data.rentalLateFeeEnabled = rentalLateFeeEnabled
    if (body.rentalLateFeeMode !== undefined) data.rentalLateFeeMode = rentalLateFeeMode
    if (body.rentalLateFeeAmount !== undefined) data.rentalLateFeeAmount = rentalLateFeeAmount
    if (body.rentalLateFeeMultiplier !== undefined) data.rentalLateFeeMultiplier = rentalLateFeeMultiplier
    if (body.rentalLateFeeGraceMinutes !== undefined) data.rentalLateFeeGraceMinutes = rentalLateFeeGraceMinutes
    if (body.rentalLateFeeMinimum !== undefined) data.rentalLateFeeMinimum = rentalLateFeeMinimum
    if (body.rentalLateFeeMaximum !== undefined) data.rentalLateFeeMaximum = rentalLateFeeMaximum
    if (body.rentalLateFeeVatRate !== undefined) data.rentalLateFeeVatRate = rentalLateFeeVatRate
    if (rentalConfig.rentalBookingMode !== 'MULTI_DAY' && hourlyPrice == null) {
      throw createError({ statusCode: 400, message: 'Le tarif horaire est requis' })
    }
    if (rentalConfig.rentalBookingMode !== 'SINGLE_DAY' && dailyPrice == null) {
      throw createError({ statusCode: 400, message: 'Le tarif journalier est requis' })
    }
  }
  else {
    data.rentalDepositAmount = null
    data.rentalDepositAllowOnsitePayment = true
    data.rentalDepositAllowOnlinePayment = false
    data.rentalLateFeeEnabled = false
    data.rentalLateFeeAmount = null
    data.rentalLateFeeMultiplier = null
    data.rentalLateFeeGraceMinutes = 0
    data.rentalLateFeeMinimum = null
    data.rentalLateFeeMaximum = null
    data.rentalLateFeeVatRate = null
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

  if (optionGroups.length) {
    await promoteProductOptionGroups(id, nextSaleType, optionGroups)
    const promotedRow = await db.product.findUnique({ where: { id }, include: { category: true } })
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

function nullableNumber(value: unknown) {
  return value == null || value === '' ? null : Number(value)
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
