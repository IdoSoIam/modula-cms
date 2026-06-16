import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const used = await db.basketItem.count({ where: { vegetableId: id } })
  if (used > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Ce légume est utilisé dans ${used} panier(s). Retirez-le des paniers d'abord.`
    })
  }
  await db.vegetable.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
