import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const productsCount = await db.product.count({ where: { categoryId: id } })

  if (productsCount > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Cette catégorie est encore utilisée par des produits.'
    })
  }

  await db.productCategory.delete({ where: { id } })
  return { ok: true }
})
