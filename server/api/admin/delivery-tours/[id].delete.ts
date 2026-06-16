import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteRuntimeDeliveryTour, isRuntimeD1Active } from '#modula/server/platform/runtimeDb'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  if (isRuntimeD1Active()) {
    await deleteRuntimeDeliveryTour(id)
  } else {
    await db.deliveryTour.delete({ where: { id } })
  }
  return { ok: true }
})
