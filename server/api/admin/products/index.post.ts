import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'
import { ensureUniqueSlug, serializeProduct } from '#modula/server/utils/shop'

interface Body {
  name: string
  slug?: string
  saleType?: 'SALE' | 'RENTAL'
  categoryId?: number | null
  excerpt?: string | null
  description?: string | null
  imageUrl?: string | null
  price?: number
  stock?: number
  unitLabel?: string | null
  allowOfflinePayment?: boolean
  allowOnlinePayment?: boolean
  active?: boolean
  position?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const price = Number(body.price ?? 0)
  const stock = Number(body.stock ?? 0)
  const allowOfflinePayment = body.allowOfflinePayment ?? true
  const allowOnlinePayment = body.allowOnlinePayment ?? false
  if (!Number.isFinite(price) || price < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Prix invalide' })
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Stock invalide' })
  }
  if (!allowOfflinePayment && !allowOnlinePayment) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un mode de paiement doit être activé' })
  }

  const slug = await ensureUniqueSlug('product', body.slug?.trim() || body.name.trim())
  const categoryId = body.categoryId == null || Number(body.categoryId) <= 0 ? null : Number(body.categoryId)

  const row = await db.product.create({
    data: {
      name: body.name.trim(),
      slug,
      saleType: body.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
      categoryId,
      excerpt: body.excerpt?.trim() || null,
      description: body.description?.trim() || null,
      imageUrl: body.imageUrl || null,
      price,
      stock,
      unitLabel: body.unitLabel?.trim() || null,
      allowOfflinePayment,
      allowOnlinePayment,
      active: body.active ?? true,
      position: body.position ?? 0
    },
    include: {
      category: true
    }
  })

  await syncImageUsageTable()
  return serializeProduct(row)
})
