import { db } from '#modula/server/data/client'
import { slugify } from '#modula/server/utils/slug'

export interface ProductPayload {
  id: number
  name: string
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number | null
  category: ProductCategoryPayload | null
  excerpt: string | null
  description: string | null
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

export interface ProductLotPayload {
  id: number
  name: string
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number | null
  category: ProductCategoryPayload | null
  description: string | null
  imageUrl: string | null
  kind: 'SINGLE' | 'LOT'
  price: number
  vatRate: number
  paymentTaxCode: string | null
  paymentTaxBehavior: 'inclusive' | 'exclusive' | null
  stock: number
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  active: boolean
  position: number
  items: Array<{
    id?: number
    productId: number
    quantity: number
    product?: ProductPayload | null
  }>
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
    productLotId: number | null
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

function computeProductLotStock(row: any) {
  const items = Array.isArray(row?.items) ? row.items : []
  if (!items.length) {
    return Math.max(0, Number(row?.stock || 0))
  }

  let minStock = Number.POSITIVE_INFINITY
  for (const item of items) {
    const itemQuantity = Number(item?.quantity || 0)
    const productStock = Number(item?.product?.stock || 0)
    if (itemQuantity <= 0) continue
    minStock = Math.min(minStock, Math.floor(productStock / itemQuantity))
  }

  if (!Number.isFinite(minStock)) {
    return Math.max(0, Number(row?.stock || 0))
  }

  return Math.max(0, minStock)
}

export function serializeProduct(row: any): ProductPayload {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    saleType: row.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
    categoryId: row.categoryId == null ? null : Number(row.categoryId),
    category: row.category ? serializeProductCategory(row.category) : null,
    excerpt: row.excerpt ?? null,
    description: row.description ?? null,
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
    unitLabel: row.unitLabel ?? null,
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

export function serializeProductLot(row: any): ProductLotPayload {
  const itemPaymentCapabilities = computePaymentModeCapabilities(
    Array.isArray(row.items)
      ? row.items
          .map((item: any) => item?.product
            ? {
                allowOfflinePayment: toBoolean(item.product.allowOfflinePayment),
                allowOnlinePayment: toBoolean(item.product.allowOnlinePayment)
              }
            : null)
          .filter(Boolean)
      : []
  )
  const hasResolvedItems = Array.isArray(row.items) && row.items.some((item: any) => item?.product)
  const allowOfflinePayment = hasResolvedItems
    ? toBoolean(row.allowOfflinePayment) && itemPaymentCapabilities.allowOfflinePayment
    : toBoolean(row.allowOfflinePayment)
  const allowOnlinePayment = hasResolvedItems
    ? toBoolean(row.allowOnlinePayment) && itemPaymentCapabilities.allowOnlinePayment
    : toBoolean(row.allowOnlinePayment)

  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    saleType: row.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
    categoryId: row.categoryId == null ? null : Number(row.categoryId),
    category: row.category ? serializeProductCategory(row.category) : null,
    description: row.description ?? null,
    imageUrl: row.imageUrl ?? null,
    kind: row.kind === 'SINGLE' ? 'SINGLE' : 'LOT',
    price: toNumber(row.price),
    vatRate: toNumber(row.vatRate),
    paymentTaxCode: row.paymentTaxCode?.trim() || null,
    paymentTaxBehavior: row.paymentTaxBehavior === 'exclusive' ? 'exclusive' : row.paymentTaxBehavior === 'inclusive' ? 'inclusive' : null,
    stock: computeProductLotStock(row),
    rentalAvailableFrom: row.rentalAvailableFrom ? new Date(row.rentalAvailableFrom).toISOString() : null,
    rentalAvailableTo: row.rentalAvailableTo ? new Date(row.rentalAvailableTo).toISOString() : null,
    rentalMinDays: Math.max(1, Number(row.rentalMinDays || 1)),
    rentalMaxDays: row.rentalMaxDays == null ? null : Math.max(1, Number(row.rentalMaxDays)),
    allowOfflinePayment,
    allowOnlinePayment,
    active: toBoolean(row.active),
    position: Number(row.position || 0),
    items: Array.isArray(row.items)
      ? row.items.map((item: any) => ({
          id: item.id == null ? undefined : Number(item.id),
          productId: Number(item.productId),
          quantity: toNumber(item.quantity),
          product: item.product ? serializeProduct(item.product) : null
        }))
      : []
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
          productLotId: line.productLotId == null ? null : Number(line.productLotId),
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

export async function ensureUniqueSlug(
  modelKey: 'product' | 'productLot' | 'productCategory',
  source: string,
  excludeId?: number
) {
  const accessor = modelKey === 'product'
    ? db.product
    : modelKey === 'productLot'
      ? db.productLot
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
