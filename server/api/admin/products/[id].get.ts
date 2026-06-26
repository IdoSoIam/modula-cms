import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeProduct } from '#modula/server/utils/shop'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const row = await db.product.findUnique({
    where: { id },
    include: {
      category: true
    }
  })

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
  }

  return serializeProduct(row)
})
