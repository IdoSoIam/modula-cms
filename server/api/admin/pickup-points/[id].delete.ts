import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteRuntimePickupPoint, isRuntimeD1Active } from '#modula/server/platform/runtimeDb'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  if (isRuntimeD1Active()) {
    await deleteRuntimePickupPoint(id)
  } else {
    await prisma.pickupPoint.delete({ where: { id } })
  }
  return { ok: true }
})
