import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isRuntimeD1Active, listRuntimePickupPoints } from '#modula/server/platform/runtimeDb'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (isRuntimeD1Active()) {
    return (await listRuntimePickupPoints()).map((point) => ({
      ...point,
      active: point.active === true || point.active === 1
    }))
  }
  return db.pickupPoint.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] })
})
