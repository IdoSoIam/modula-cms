import type { CmsLocalizedText } from './cms'
import type { RentalRate } from './rentalRates'
export {
  getProductOptionBasePrice,
  getProductOptionCalculatedUnitPrice,
  getProductOptionChargedQuantity,
  getProductOptionTimeFactor,
} from './productOptionPricing.ts'

export type ProductOptionKind = 'SUPPLEMENT' | 'INSURANCE' | 'ACCESSORY'
export type ProductOptionPricingMode = 'FIXED' | 'RENTAL_DURATION'
export type ProductOptionQuantityMode = 'PER_RESERVATION' | 'PER_PRODUCT_UNIT' | 'CUSTOM'
export type ProductOptionSelectionMode = 'SINGLE' | 'MULTIPLE'
export type ProductOptionPriceSource = 'CUSTOM' | 'LINKED_PRODUCT'
export type ProductOptionRentalPeriodMode = 'PARENT_PERIOD' | 'FIXED_DURATION'

export interface ProductOptionLinkedProduct {
  id: number
  name: string
  nameLocalized: CmsLocalizedText
  saleType: 'SALE' | 'RENTAL'
  active: boolean
  stock: number
  price: number
  vatRate: number
  paymentTaxCode: string | null
  paymentTaxBehavior: 'inclusive' | 'exclusive' | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  rentalBookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
  rentalHourlyPrice: number | null
  rentalDailyPrice: number | null
  rentalPricingStrategy: 'LINEAR' | 'GRID'
  rentalRates: RentalRate[]
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  rentalDurations: number[]
  rentalSlotStepMinutes: number
  rentalApprovalMode: 'AUTO' | 'MANUAL'
  rentalDepositAmount: number | null
  rentalDepositAllowOnsitePayment: boolean
  rentalDepositAllowOnlinePayment: boolean
}

export interface ProductOptionBillingDocument {
  id: number
  name: string
  kind: 'CONTRACT' | 'ASSURANCE'
}

export interface ProductOption {
  id: string
  label: string
  labelLocalized: CmsLocalizedText
  description: string
  descriptionLocalized: CmsLocalizedText
  kind: ProductOptionKind
  pricingMode: ProductOptionPricingMode
  quantityMode: ProductOptionQuantityMode
  priceSource: ProductOptionPriceSource
  price: number
  hourlyPrice: number | null
  dailyPrice: number | null
  rentalPeriodMode: ProductOptionRentalPeriodMode
  rentalDurationMinutes: number[]
  vatRate: number | null
  defaultQuantity: number
  minQuantity: number
  maxQuantity: number | null
  quantityEditable: boolean
  linkedProductId: number | null
  billingDocumentId: number | null
  active: boolean
  position: number
  linkedProduct: ProductOptionLinkedProduct | null
  billingDocument: ProductOptionBillingDocument | null
}

export interface ProductOptionGroup {
  id: string
  title: string
  titleLocalized: CmsLocalizedText
  description: string
  descriptionLocalized: CmsLocalizedText
  selectionMode: ProductOptionSelectionMode
  required: boolean
  minSelections: number
  maxSelections: number | null
  position: number
  options: ProductOption[]
}

export interface ProductOptionSelectionInput {
  optionId: string
  quantity?: number
  rentalDurationMinutes?: number
  rentalStartDate?: string | null
}

export interface ProductOptionOverride {
  optionSetId: number
  optionId: string
  enabled: boolean
  price: number | null
}

export function normalizeProductOptionGroups(value: unknown, locales: string[] = ['fr', 'en']): ProductOptionGroup[] {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = []
    }
  }
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((entry, index) => normalizeProductOptionGroup(entry, locales, index))
    .filter((entry): entry is ProductOptionGroup => Boolean(entry))
    .sort((a, b) => a.position - b.position)
}

function normalizeProductOptionGroup(value: unknown, locales: string[], index: number): ProductOptionGroup | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const options = Array.isArray(source.options)
    ? source.options
        .map((entry, optionIndex) => normalizeProductOption(entry, locales, optionIndex))
        .filter((entry): entry is ProductOption => Boolean(entry))
        .sort((a, b) => a.position - b.position)
    : []
  const selectionMode: ProductOptionSelectionMode = source.selectionMode === 'SINGLE' ? 'SINGLE' : 'MULTIPLE'
  const required = Boolean(source.required)
  const minSelections = required ? Math.max(1, integer(source.minSelections, 1)) : Math.max(0, integer(source.minSelections, 0))
  const requestedMaximum = nullableInteger(source.maxSelections)
  const maxSelections = selectionMode === 'SINGLE' ? 1 : requestedMaximum == null ? null : Math.max(minSelections, requestedMaximum)
  const titleLocalized = normalizeLocalizedText(source.titleLocalized, locales, source.title)
  const descriptionLocalized = normalizeLocalizedText(source.descriptionLocalized, locales, source.description)
  return {
    id: identifier(source.id, `group-${index + 1}`),
    title: fallbackLocalizedText(titleLocalized, source.title),
    titleLocalized,
    description: fallbackLocalizedText(descriptionLocalized, source.description),
    descriptionLocalized,
    selectionMode,
    required,
    minSelections,
    maxSelections,
    position: integer(source.position, index),
    options,
  }
}

function normalizeProductOption(value: unknown, locales: string[], index: number): ProductOption | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const kind: ProductOptionKind = source.kind === 'INSURANCE' ? 'INSURANCE' : source.kind === 'ACCESSORY' ? 'ACCESSORY' : 'SUPPLEMENT'
  const legacyPricingMode = source.pricingMode === 'PER_HOUR' || source.pricingMode === 'PER_DAY'
  const pricingMode: ProductOptionPricingMode = source.pricingMode === 'RENTAL_DURATION' || legacyPricingMode ? 'RENTAL_DURATION' : 'FIXED'
  const quantityMode: ProductOptionQuantityMode =
    kind === 'ACCESSORY' ? 'CUSTOM' : source.quantityMode === 'PER_PRODUCT_UNIT' ? 'PER_PRODUCT_UNIT' : 'PER_RESERVATION'
  const labelLocalized = normalizeLocalizedText(source.labelLocalized, locales, source.label)
  const descriptionLocalized = normalizeLocalizedText(source.descriptionLocalized, locales, source.description)
  const minQuantity = Math.max(0, integer(source.minQuantity, kind === 'ACCESSORY' ? 0 : 1))
  const requestedMaximumQuantity = nullableInteger(source.maxQuantity)
  const maxQuantity = requestedMaximumQuantity == null ? null : Math.max(minQuantity, requestedMaximumQuantity)
  const defaultQuantity = Math.min(maxQuantity ?? Number.MAX_SAFE_INTEGER, Math.max(minQuantity, integer(source.defaultQuantity, Math.max(1, minQuantity))))

  return {
    id: identifier(source.id, `option-${index + 1}`),
    label: fallbackLocalizedText(labelLocalized, source.label),
    labelLocalized,
    description: fallbackLocalizedText(descriptionLocalized, source.description),
    descriptionLocalized,
    kind,
    pricingMode,
    quantityMode,
    priceSource: kind === 'ACCESSORY' && source.priceSource !== 'CUSTOM' ? 'LINKED_PRODUCT' : 'CUSTOM',
    price: Math.max(0, number(source.price)),
    hourlyPrice: nullablePrice(source.hourlyPrice ?? (source.pricingMode === 'PER_HOUR' ? source.price : null)),
    dailyPrice: nullablePrice(source.dailyPrice ?? (source.pricingMode === 'PER_DAY' ? source.price : null)),
    rentalPeriodMode: source.rentalPeriodMode === 'FIXED_DURATION' ? 'FIXED_DURATION' : 'PARENT_PERIOD',
    rentalDurationMinutes: normalizeDurationMinutes(source.rentalDurationMinutes),
    vatRate: source.vatRate == null || source.vatRate === '' ? null : Math.max(0, number(source.vatRate)),
    defaultQuantity,
    minQuantity,
    maxQuantity,
    quantityEditable: source.quantityEditable !== false,
    linkedProductId: kind === 'ACCESSORY' ? positiveInteger(source.linkedProductId) : null,
    billingDocumentId: kind === 'INSURANCE' ? positiveInteger(source.billingDocumentId) : null,
    active: source.active !== false,
    position: integer(source.position, index),
    linkedProduct: null,
    billingDocument: null,
  }
}

function normalizeDurationMinutes(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map(Number).filter((entry) => Number.isInteger(entry) && entry > 0))).sort((left, right) => left - right)
}

export function normalizeProductOptionOverrides(value: unknown): ProductOptionOverride[] {
  let parsed = value
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value)
    } catch {
      parsed = []
    }
  }
  if (!Array.isArray(parsed)) return []
  const unique = new Map<string, ProductOptionOverride>()
  for (const entry of parsed) {
    if (!entry || typeof entry !== 'object') continue
    const source = entry as Record<string, unknown>
    const optionSetId = positiveInteger(source.optionSetId)
    const optionId = String(source.optionId || '').trim()
    if (!optionSetId || !optionId) continue
    unique.set(`${optionSetId}:${optionId}`, {
      optionSetId,
      optionId,
      enabled: source.enabled !== false,
      price: source.price == null || source.price === '' ? null : Math.max(0, number(source.price)),
    })
  }
  return Array.from(unique.values())
}

function normalizeLocalizedText(value: unknown, locales: string[], fallback: unknown): CmsLocalizedText {
  const normalized = Object.fromEntries(locales.map((locale) => [locale, ''])) as CmsLocalizedText
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [locale, text] of Object.entries(value as Record<string, unknown>)) {
      normalized[locale] = String(text || '').trim()
    }
  }
  const fallbackText = String(fallback || '').trim()
  if (fallbackText && !Object.values(normalized).some(Boolean)) {
    const targetLocale = locales.includes('fr') ? 'fr' : locales[0] || 'fr'
    normalized[targetLocale] = fallbackText
  }
  return normalized
}

function fallbackLocalizedText(value: CmsLocalizedText, fallback: unknown) {
  return String(value.fr || value.en || Object.values(value).find(Boolean) || fallback || '').trim()
}

function identifier(value: unknown, fallback: string) {
  const normalized = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '-')
  return normalized || fallback
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function integer(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

function nullableInteger(value: unknown) {
  if (value == null || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function positiveInteger(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function nullablePrice(value: unknown) {
  if (value == null || value === '') return null
  return Math.max(0, number(value))
}
