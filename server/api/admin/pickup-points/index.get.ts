import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isRuntimeD1Active, listRuntimePickupPoints } from '#modula/server/platform/runtimeDb'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (isRuntimeD1Active()) {
    return (await listRuntimePickupPoints()).map((point) => ({
      ...point,
      active: point.active === true || point.active === 1
    }))
  }
  return prisma.pickupPoint.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] })
})
