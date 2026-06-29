import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const usedInOrders = await db.shopOrderLine.count({ where: { productId: id } })
  if (usedInOrders > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ce produit est déjà utilisé et ne peut pas être supprimé.'
    })
  }

  await db.product.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
