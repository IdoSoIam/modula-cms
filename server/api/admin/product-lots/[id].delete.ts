import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const usedInOrders = await db.shopOrderLine.count({ where: { productLotId: id } })
  if (usedInOrders > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ce lot est déjà présent dans des commandes et ne peut pas être supprimé.'
    })
  }

  await db.productLotItem.deleteMany({ where: { productLotId: id } })
  await db.productLot.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
