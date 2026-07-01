import { db } from '#modula/server/data/client'
import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import { slugify } from '#modula/server/utils/slug'
import type { BillingDocumentKind } from '#modula/server/utils/billingDocuments'

export interface ProductPayload {
  id: number
  name: string
  nameLocalized: CmsLocalizedText
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number | null
  category: ProductCategoryPayload | null
  excerpt: string | null
  excerptLocalized: CmsLocalizedText
  description: string | null
  descriptionLocalized: CmsLocalizedText
  detailSections: ProductDetailSection[]
  imageUrl: string | null
  price: number
  vatRate: number
  paymentTaxCode: string | null
  paymentTaxBehavior: 'inclusive' | 'exclusive' | null
  stock: number
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  unitLabel: string | null
  unitLabelLocalized: CmsLocalizedText
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  active: boolean
  position: number
}

export interface ProductCategoryPayload {
  id: number
  name: string
  slug: string
  description: string | null
  position: number
  active: boolean
}

export interface PaymentModeCapabilities {
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
}

export interface ShopOrderPayload {
  id: number
  orderNumber: string
  language: string
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
  paymentProvider: 'OFFLINE' | 'STRIPE'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  providerSessionId: string | null
  providerPaymentIntentId: string | null
  providerPaymentStatus: string | null
  providerLastEventId: string | null
  paymentFailureReason: string | null
  customerName: string
  email: string
  phone: string | null
  message: string | null
  deliveryType: 'ONSITE' | 'PICKUP' | 'TOUR' | null
  pickupPointId: number | null
  deliveryTourId: number | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  rentalStartDate: string | null
  rentalEndDate: string | null
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  pickupPoint: {
    id: number
    name: string
    address: string | null
  } | null
  deliveryTour: {
    id: number
    name: string
    dayOfWeek: number
    startTime: string
    endTime: string
  } | null
  currency: string
  subtotal: number
  total: number
  checkoutUrl: string | null
  paidAt: string | null
  refundedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  lines: Array<{
    id: number
    orderId: number
    productId: number | null
    title: string
    quantity: number
    unitPrice: number
    totalPrice: number
    rentalStartDate: string | null
    rentalEndDate: string | null
    meta: Record<string, any>
  }>
}

export interface ProductDetailField {
  id: string
  label: string
  labelLocalized: CmsLocalizedText
  value: string
  valueLocalized: CmsLocalizedText
  mediaKind: 'image' | 'pdf' | 'billingDocument' | null
  mediaUrl: string | null
  mediaDocumentId: number | null
  mediaDocumentName: string | null
  mediaDocumentKind: BillingDocumentKind | null
}

export interface ProductDetailSection {
  id: string
  title: string
  titleLocalized: CmsLocalizedText
  items: ProductDetailField[]
}

function toNumber(value: unknown) {
  return Number(value || 0)
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function computePaymentModeCapabilities(
  sources: PaymentModeCapabilities[]
): PaymentModeCapabilities {
  if (!sources.length) {
    return {
      allowOfflinePayment: true,
      allowOnlinePayment: true
    }
  }

  return {
    allowOfflinePayment: sources.every((source) => Boolean(source.allowOfflinePayment)),
    allowOnlinePayment: sources.every((source) => Boolean(source.allowOnlinePayment))
  }
}

export function serializeProduct(row: any): ProductPayload {
  const nameLocalized = normalizeProductLocalizedText(row.nameJson, String(row.name || ''))
  const excerptLocalized = normalizeProductLocalizedText(row.excerptJson, row.excerpt ?? '')
  const descriptionLocalized = normalizeProductLocalizedText(row.descriptionJson, row.description ?? '')
  const unitLabelLocalized = normalizeProductLocalizedText(row.unitLabelJson, row.unitLabel ?? '')

  return {
    id: Number(row.id),
    name: resolveLocalizedProductText(nameLocalized, String(row.name || '')),
    nameLocalized,
    slug: String(row.slug),
    saleType: row.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
    categoryId: row.categoryId == null ? null : Number(row.categoryId),
    category: row.category ? serializeProductCategory(row.category) : null,
    excerpt: resolveNullableLocalizedProductText(excerptLocalized, row.excerpt ?? null),
    excerptLocalized,
    description: resolveNullableLocalizedProductText(descriptionLocalized, row.description ?? null),
    descriptionLocalized,
    detailSections: normalizeProductDetailSections(row.detailsJson),
    imageUrl: row.imageUrl ?? null,
    price: toNumber(row.price),
    vatRate: toNumber(row.vatRate),
    paymentTaxCode: row.paymentTaxCode?.trim() || null,
    paymentTaxBehavior: row.paymentTaxBehavior === 'exclusive' ? 'exclusive' : row.paymentTaxBehavior === 'inclusive' ? 'inclusive' : null,
    stock: Math.max(0, Number(row.stock || 0)),
    rentalAvailableFrom: row.rentalAvailableFrom ? new Date(row.rentalAvailableFrom).toISOString() : null,
    rentalAvailableTo: row.rentalAvailableTo ? new Date(row.rentalAvailableTo).toISOString() : null,
    rentalMinDays: Math.max(1, Number(row.rentalMinDays || 1)),
    rentalMaxDays: row.rentalMaxDays == null ? null : Math.max(1, Number(row.rentalMaxDays)),
    unitLabel: resolveNullableLocalizedProductText(unitLabelLocalized, row.unitLabel ?? null),
    unitLabelLocalized,
    allowOfflinePayment: toBoolean(row.allowOfflinePayment),
    allowOnlinePayment: toBoolean(row.allowOnlinePayment),
    active: toBoolean(row.active),
    position: Number(row.position || 0)
  }
}

export function serializeProductCategory(row: any): ProductCategoryPayload {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ?? null,
    position: Number(row.position || 0),
    active: Boolean(row.active)
  }
}

export function serializeShopOrder(row: any): ShopOrderPayload {
  return {
    id: Number(row.id),
    orderNumber: String(row.orderNumber),
    language: typeof row.language === 'string' && row.language.trim() ? row.language : 'fr',
    status: row.status,
    paymentProvider: row.paymentProvider,
    paymentStatus: row.paymentStatus,
    providerSessionId: row.providerSessionId ?? null,
    providerPaymentIntentId: row.providerPaymentIntentId ?? null,
    providerPaymentStatus: row.providerPaymentStatus ?? null,
    providerLastEventId: row.providerLastEventId ?? null,
    paymentFailureReason: row.paymentFailureReason ?? null,
    customerName: String(row.customerName),
    email: String(row.email),
    phone: row.phone ?? null,
    message: row.message ?? null,
    deliveryType: row.deliveryType === 'PICKUP' || row.deliveryType === 'TOUR' || row.deliveryType === 'ONSITE'
      ? row.deliveryType
      : null,
    pickupPointId: row.pickupPointId == null ? null : Number(row.pickupPointId),
    deliveryTourId: row.deliveryTourId == null ? null : Number(row.deliveryTourId),
    deliveryAddress: row.deliveryAddress ?? null,
    deliveryCity: row.deliveryCity ?? null,
    deliveryPostalCode: row.deliveryPostalCode ?? null,
    rentalStartDate: row.rentalStartDate ? new Date(row.rentalStartDate).toISOString() : null,
    rentalEndDate: row.rentalEndDate ? new Date(row.rentalEndDate).toISOString() : null,
    fulfillmentDate: row.fulfillmentDate ? new Date(row.fulfillmentDate).toISOString() : null,
    fulfillmentTime: row.fulfillmentTime ?? null,
    fulfillmentLocation: row.fulfillmentLocation ?? null,
    pickupPoint: row.pickupPoint
      ? {
          id: Number(row.pickupPoint.id),
          name: String(row.pickupPoint.name),
          address: row.pickupPoint.address ?? null
        }
      : null,
    deliveryTour: row.deliveryTour
      ? {
          id: Number(row.deliveryTour.id),
          name: String(row.deliveryTour.name),
          dayOfWeek: Number(row.deliveryTour.dayOfWeek || 0),
          startTime: String(row.deliveryTour.startTime || ''),
          endTime: String(row.deliveryTour.endTime || '')
        }
      : null,
    currency: String(row.currency || 'eur'),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    checkoutUrl: row.checkoutUrl ?? null,
    paidAt: row.paidAt ?? null,
    refundedAt: row.refundedAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    lines: Array.isArray(row.lines)
      ? row.lines.map((line: any) => ({
          id: Number(line.id),
          orderId: Number(line.orderId),
          productId: line.productId == null ? null : Number(line.productId),
          title: String(line.title),
          quantity: Number(line.quantity || 0),
          unitPrice: toNumber(line.unitPrice),
          totalPrice: toNumber(line.totalPrice),
          rentalStartDate: line.rentalStartDate ? new Date(line.rentalStartDate).toISOString() : null,
          rentalEndDate: line.rentalEndDate ? new Date(line.rentalEndDate).toISOString() : null,
          meta: safeParseJson(line.metaJson)
        }))
      : []
  }
}

function safeParseJson(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

export function normalizeProductDetailSections(value: unknown): ProductDetailSection[] {
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((section) => normalizeProductDetailSection(section))
      .filter((section): section is ProductDetailSection => Boolean(section))
  } catch {
    return []
  }
}

export function normalizeProductDetailSectionsInput(value: unknown): ProductDetailSection[] {
  if (!Array.isArray(value)) return []
  return value
    .map((section) => normalizeProductDetailSection(section))
    .filter((section): section is ProductDetailSection => Boolean(section))
}

function normalizeProductDetailSection(value: unknown): ProductDetailSection | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  const titleLocalized = normalizeProductLocalizedText(entry.titleLocalized ?? entry.title, typeof entry.title === 'string' ? entry.title : '')
  const items = Array.isArray(entry.items)
    ? entry.items
        .map((item) => normalizeProductDetailField(item))
        .filter((item): item is ProductDetailField => Boolean(item))
    : []

  if (!hasLocalizedText(titleLocalized) && !items.length) return null

  return {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : crypto.randomUUID(),
    title: resolveLocalizedProductText(titleLocalized, 'Section'),
    titleLocalized,
    items
  }
}

function normalizeProductDetailField(value: unknown): ProductDetailField | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  const labelLocalized = normalizeProductLocalizedText(entry.labelLocalized ?? entry.label, typeof entry.label === 'string' ? entry.label : '')
  const valueLocalized = normalizeProductLocalizedText(entry.valueLocalized ?? entry.value, typeof entry.value === 'string' ? entry.value : '')
  const mediaKind = entry.mediaKind === 'image' || entry.mediaKind === 'pdf' || entry.mediaKind === 'billingDocument'
    ? entry.mediaKind
    : null
  const mediaUrl = typeof entry.mediaUrl === 'string' && entry.mediaUrl.trim() ? entry.mediaUrl.trim() : null
  const mediaDocumentId = Number.isInteger(Number(entry.mediaDocumentId)) && Number(entry.mediaDocumentId) > 0
    ? Number(entry.mediaDocumentId)
    : null
  const mediaDocumentName = typeof entry.mediaDocumentName === 'string' && entry.mediaDocumentName.trim()
    ? entry.mediaDocumentName.trim()
    : null
  const mediaDocumentKind = entry.mediaDocumentKind === 'INVOICE' || entry.mediaDocumentKind === 'CONTRACT' || entry.mediaDocumentKind === 'ASSURANCE'
    ? entry.mediaDocumentKind
    : null
  if (!hasLocalizedText(labelLocalized) && !hasLocalizedText(valueLocalized) && !mediaUrl && !mediaDocumentId) return null
  return {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : crypto.randomUUID(),
    label: resolveLocalizedProductText(labelLocalized, 'Champ'),
    labelLocalized,
    value: resolveLocalizedProductText(valueLocalized, ''),
    valueLocalized,
    mediaKind,
    mediaUrl,
    mediaDocumentId,
    mediaDocumentName,
    mediaDocumentKind
  }
}

export function normalizeProductLocalizedText(value: unknown, fallback = ''): CmsLocalizedText {
  const normalized: CmsLocalizedText = {}

  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        return normalizeProductLocalizedText(JSON.parse(text), fallback)
      } catch {
        // Ignore malformed JSON and keep legacy plain-text behavior.
      }
    }
    return {
      fr: text || fallback,
      en: text || fallback
    }
  }

  if (value && typeof value === 'object') {
    const entry = value as Record<string, unknown>
    for (const [locale, localeValue] of Object.entries(entry)) {
      const normalizedLocale = String(locale || '').trim().toLowerCase()
      if (!normalizedLocale) continue
      normalized[normalizedLocale] = typeof localeValue === 'string' ? localeValue.trim() : ''
    }
  }

  if (!normalized.fr && fallback) normalized.fr = fallback.trim()
  if (!normalized.en && fallback) normalized.en = fallback.trim()

  return normalized
}

export function hasLocalizedText(value: CmsLocalizedText | null | undefined) {
  return Boolean(
    value
    && Object.values(value).some((entry) => typeof entry === 'string' && entry.trim())
  )
}

export function resolveLocalizedProductText(value: CmsLocalizedText | null | undefined, fallback = '') {
  if (!value) return fallback
  return pickCmsLocalizedText('fr', value, 'en') || fallback
}

export function resolveNullableLocalizedProductText(value: CmsLocalizedText | null | undefined, fallback: string | null = null) {
  const resolved = resolveLocalizedProductText(value, fallback || '')
  return resolved.trim() ? resolved : null
}

export function buildLocalizedProductTextPayload(value: unknown, fallback = '') {
  const normalized = normalizeProductLocalizedText(value, fallback)
  return {
    text: resolveLocalizedProductText(normalized, fallback),
    json: JSON.stringify(normalized)
  }
}

export function pickProductLocalizedText(locale: string, value: CmsLocalizedText | null | undefined, fallback = '') {
  const selected = pickCmsLocalizedText(locale, value)
  return selected?.trim() || resolveLocalizedProductText(value, fallback)
}

export async function ensureUniqueSlug(
  modelKey: 'product' | 'productCategory',
  source: string,
  excludeId?: number
) {
  const accessor = modelKey === 'product'
    ? db.product
    : db.productCategory
  const base = slugify(source || 'item')
  let slug = base
  let suffix = 2

  while (true) {
    const existing = await accessor.findFirst({
      where: excludeId ? { slug, id: { not: excludeId } } : { slug }
    })
    if (!existing) return slug
    slug = `${base}-${suffix}`
    suffix += 1
  }
}

export function createOrderNumber(id: number) {
  return `ORD-${String(id).padStart(6, '0')}`
}
