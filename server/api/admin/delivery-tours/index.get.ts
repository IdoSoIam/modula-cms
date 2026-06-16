import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isRuntimeD1Active, listRuntimeDeliveryTours } from '#modula/server/platform/runtimeDb'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (isRuntimeD1Active()) {
    return await listRuntimeDeliveryTours()
  }
  const tours = await prisma.deliveryTour.findMany({
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: { cities: true }
  })
  return tours.map(t => ({
    ...t,
    monthlyPrice: t.monthlyPrice !== null ? Number(t.monthlyPrice) : null
  }))
})
