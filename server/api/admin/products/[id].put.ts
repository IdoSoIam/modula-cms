import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'
import { ensureUniqueSlug, serializeProduct } from '#modula/server/utils/shop'
import { normalizeStripeTaxBehavior, normalizeStripeTaxCode, normalizeVatRate } from '#modula/server/utils/settings'

interface Body {
  name?: string
  slug?: string
  saleType?: 'SALE' | 'RENTAL'
  categoryId?: number | null
  excerpt?: string | null
  description?: string | null
  imageUrl?: string | null
  price?: number
  vatRate?: number
  stripeTaxCode?: string | null
  stripeTaxBehavior?: 'inclusive' | 'exclusive' | null
  stock?: number
  unitLabel?: string | null
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

  if (body.name !== undefined) data.name = body.name.trim()
  if (body.excerpt !== undefined) data.excerpt = body.excerpt?.trim() || null
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
  if (body.unitLabel !== undefined) data.unitLabel = body.unitLabel?.trim() || null
  if (body.saleType !== undefined) data.saleType = body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE'
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
  if (body.stripeTaxCode !== undefined) {
    data.stripeTaxCode = normalizeStripeTaxCode(body.stripeTaxCode) || null
  }
  if (body.stripeTaxBehavior !== undefined) {
    data.stripeTaxBehavior = body.stripeTaxBehavior == null
      ? null
      : normalizeStripeTaxBehavior(body.stripeTaxBehavior, existing.stripeTaxBehavior === 'exclusive' ? 'exclusive' : 'inclusive')
  }
  if (body.stock !== undefined) {
    const stock = Number(body.stock)
    if (!Number.isInteger(stock) || stock < 0) {
      throw createError({ statusCode: 400, statusMessage: 'Stock invalide' })
    }
    data.stock = stock
  }

  if (body.slug !== undefined || body.name !== undefined) {
    data.slug = await ensureUniqueSlug('product', body.slug?.trim() || body.name?.trim() || existing.slug, id)
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
