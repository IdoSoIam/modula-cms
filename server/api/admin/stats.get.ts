import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isSubscriptionsEnabled } from '#modula/server/utils/settings'
import { prisma } from '../../../prisma/client'

function startOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfDay(date: Date) {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const subscriptionsEnabled = await isSubscriptionsEnabled()

  const today = startOfDay(new Date())
  const next7Days = endOfDay(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6))
  const monthEnd = endOfDay(new Date(today.getFullYear(), today.getMonth() + 1, 0))

  const [
    vegetables,
    activeBaskets,
    pendingReservations,
    upcomingReservations,
    activeSubscriptions,
    upcomingOccurrences7Days,
    upcomingOccurrencesMonth,
    completedOccurrences,
    cancelledOccurrences,
    archivedReservations,
    rejectedReservations
  ] = await Promise.all([
    prisma.vegetable.count(),
    prisma.basket.count({ where: { active: true } }),
    prisma.reservation.count({ where: { status: 'PENDING', archivedAt: null } }),
    prisma.reservation.count({
      where: {
        archivedAt: null,
        OR: [
          { fulfillmentDate: { gte: today } },
          { createdAt: { gte: today } }
        ]
      }
    }),
    subscriptionsEnabled
      ? prisma.reservation.count({
          where: {
            status: 'CONFIRMED',
            monthlySubscription: true,
            subscriptionActive: true,
            archivedAt: null
          }
        })
      : Promise.resolve(0),
    subscriptionsEnabled
      ? prisma.reservationOccurrence.count({
          where: {
            status: 'SCHEDULED',
            occurrenceDate: { gte: today, lte: next7Days }
          }
        })
      : prisma.reservation.count({
          where: {
            status: 'CONFIRMED',
            archivedAt: null,
            fulfillmentDate: { gte: today, lte: next7Days }
          }
        }),
    subscriptionsEnabled
      ? prisma.reservationOccurrence.count({
          where: {
            status: 'SCHEDULED',
            occurrenceDate: { gte: today, lte: monthEnd }
          }
        })
      : prisma.reservation.count({
          where: {
            status: 'CONFIRMED',
            archivedAt: null,
            fulfillmentDate: { gte: today, lte: monthEnd }
          }
        }),
    subscriptionsEnabled
      ? prisma.reservationOccurrence.count({
          where: {
            occurrenceDate: { lt: today }
          }
        })
      : prisma.reservation.count({
          where: {
            archivedAt: null,
            fulfillmentDate: { lt: today }
          }
        }),
    subscriptionsEnabled
      ? prisma.reservationOccurrence.count({
          where: {
            status: 'CANCELLED',
            occurrenceDate: { gte: today }
          }
        })
      : prisma.reservation.count({
          where: {
            status: 'CANCELLED',
            archivedAt: null,
            fulfillmentDate: { gte: today }
          }
        }),
    prisma.reservation.count({ where: { archivedAt: { not: null } } }),
    prisma.reservation.count({ where: { status: 'REJECTED', archivedAt: null } })
  ])

  return {
    vegetables,
    activeBaskets,
    pendingReservations,
    upcomingReservations,
    activeSubscriptions,
    upcomingOccurrences7Days,
    upcomingOccurrencesMonth,
    completedOccurrences,
    cancelledOccurrences,
    archivedReservations,
    rejectedReservations,
    subscriptionsEnabled
  }
})
