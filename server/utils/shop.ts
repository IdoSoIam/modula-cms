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
  stock: number
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
  stock: number
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

export interface ShopOrderPayload {
  id: number
  orderNumber: string
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
  paymentProvider: 'OFFLINE' | 'STRIPE'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  stripeCheckoutSessionId: string | null
  customerName: string
  email: string
  phone: string | null
  message: string | null
  currency: string
  subtotal: number
  total: number
  checkoutUrl: string | null
  paidAt: string | null
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
    meta: Record<string, any>
  }>
}

function toNumber(value: unknown) {
  return Number(value || 0)
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
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
    stock: Math.max(0, Number(row.stock || 0)),
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
    stock: computeProductLotStock(row),
    allowOfflinePayment: toBoolean(row.allowOfflinePayment),
    allowOnlinePayment: toBoolean(row.allowOnlinePayment),
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
    status: row.status,
    paymentProvider: row.paymentProvider,
    paymentStatus: row.paymentStatus,
    stripeCheckoutSessionId: row.stripeCheckoutSessionId ?? null,
    customerName: String(row.customerName),
    email: String(row.email),
    phone: row.phone ?? null,
    message: row.message ?? null,
    currency: String(row.currency || 'eur'),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    checkoutUrl: row.checkoutUrl ?? null,
    paidAt: row.paidAt ?? null,
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
