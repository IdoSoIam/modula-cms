import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const tours = await prisma.deliveryTour.findMany({
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    include: { cities: true }
  })
  return tours.map(t => ({
    ...t,
    monthlyPrice: t.monthlyPrice !== null ? Number(t.monthlyPrice) : null
  }))
})
