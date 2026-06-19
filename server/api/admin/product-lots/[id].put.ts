import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'
import { ensureUniqueSlug, serializeProductLot } from '#modula/server/utils/shop'

interface Body {
  name?: string
  slug?: string
  saleType?: 'SALE' | 'RENTAL'
  categoryId?: number | null
  description?: string | null
  imageUrl?: string | null
  kind?: 'SINGLE' | 'LOT'
  price?: number
  allowOfflinePayment?: boolean
  allowOnlinePayment?: boolean
  active?: boolean
  position?: number
  items?: Array<{
    productId: number
    quantity: number
  }>
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const existing = await db.productLot.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Lot introuvable' })
  }

  const body = await readBody<Body>(event)
  const data: Record<string, any> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null
  if (body.saleType !== undefined) data.saleType = body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE'
  if (body.categoryId !== undefined) data.categoryId = body.categoryId == null || Number(body.categoryId) <= 0 ? null : Number(body.categoryId)
  if (body.kind !== undefined) data.kind = body.kind === 'SINGLE' ? 'SINGLE' : 'LOT'
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
  if (body.slug !== undefined || body.name !== undefined) {
    data.slug = await ensureUniqueSlug('productLot', body.slug?.trim() || body.name?.trim() || existing.slug, id)
  }

  await db.productLot.update({
    where: { id },
    data
  })

  if (body.items) {
    const items = body.items.filter((item) => Number(item.productId) > 0 && Number(item.quantity) > 0)
    await db.productLotItem.deleteMany({ where: { productLotId: id } })
    if (items.length) {
      await db.productLotItem.createMany({
        data: items.map((item) => ({
          productLotId: id,
          productId: Number(item.productId),
          quantity: Number(item.quantity)
        }))
      })
    }
  }

  const withItems = await db.productLot.findUnique({
    where: { id },
    include: {
      category: true,
      items: {
        include: {
          product: true
        }
      }
    }
  })

  await syncImageUsageTable()
  return serializeProductLot(withItems)
})
