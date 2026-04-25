import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [vegetables, activeBaskets, pendingReservations, confirmedReservations] = await Promise.all([
    prisma.vegetable.count(),
    prisma.basket.count({ where: { active: true } }),
    prisma.reservation.count({ where: { status: 'PENDING' } }),
    prisma.reservation.count({ where: { status: 'CONFIRMED' } })
  ])
  return { vegetables, activeBaskets, pendingReservations, confirmedReservations }
})
