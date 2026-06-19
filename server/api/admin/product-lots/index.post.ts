import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'
import { ensureUniqueSlug, serializeProductLot } from '#modula/server/utils/shop'

interface Body {
  name: string
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
  const body = await readBody<Body>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const price = Number(body.price ?? 0)
  const allowOfflinePayment = body.allowOfflinePayment ?? true
  const allowOnlinePayment = body.allowOnlinePayment ?? false
  if (!Number.isFinite(price) || price < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Prix invalide' })
  }
  if (!allowOfflinePayment && !allowOnlinePayment) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un mode de paiement doit être activé' })
  }

  const kind = body.kind === 'SINGLE' ? 'SINGLE' : 'LOT'
  const slug = await ensureUniqueSlug('productLot', body.slug?.trim() || body.name.trim())
  const categoryId = body.categoryId == null || Number(body.categoryId) <= 0 ? null : Number(body.categoryId)
  const items = (body.items || []).filter((item) => Number(item.productId) > 0 && Number(item.quantity) > 0)

  const lot = await db.productLot.create({
    data: {
      name: body.name.trim(),
      slug,
      saleType: body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
      categoryId,
      description: body.description?.trim() || null,
      imageUrl: body.imageUrl || null,
      kind,
      price,
      allowOfflinePayment,
      allowOnlinePayment,
      active: body.active ?? true,
      position: body.position ?? 0
    }
  })

  if (items.length) {
    await db.productLotItem.createMany({
      data: items.map((item) => ({
        productLotId: lot.id,
        productId: Number(item.productId),
        quantity: Number(item.quantity)
      }))
    })
  }

  const withItems = await db.productLot.findUnique({
    where: { id: lot.id },
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
