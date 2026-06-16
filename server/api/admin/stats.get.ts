import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isSubscriptionsEnabled } from '#modula/server/utils/settings'
import { db } from '#modula/server/data/client'

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
    db.vegetable.count(),
    db.basket.count({ where: { active: true } }),
    db.reservation.count({ where: { status: 'PENDING', archivedAt: null } }),
    db.reservation.count({
      where: {
        archivedAt: null,
        OR: [
          { fulfillmentDate: { gte: today } },
          { createdAt: { gte: today } }
        ]
      }
    }),
    subscriptionsEnabled
      ? db.reservation.count({
          where: {
            status: 'CONFIRMED',
            monthlySubscription: true,
            subscriptionActive: true,
            archivedAt: null
          }
        })
      : Promise.resolve(0),
    subscriptionsEnabled
      ? db.reservationOccurrence.count({
          where: {
            status: 'SCHEDULED',
            occurrenceDate: { gte: today, lte: next7Days }
          }
        })
      : db.reservation.count({
          where: {
            status: 'CONFIRMED',
            archivedAt: null,
            fulfillmentDate: { gte: today, lte: next7Days }
          }
        }),
    subscriptionsEnabled
      ? db.reservationOccurrence.count({
          where: {
            status: 'SCHEDULED',
            occurrenceDate: { gte: today, lte: monthEnd }
          }
        })
      : db.reservation.count({
          where: {
            status: 'CONFIRMED',
            archivedAt: null,
            fulfillmentDate: { gte: today, lte: monthEnd }
          }
        }),
    subscriptionsEnabled
      ? db.reservationOccurrence.count({
          where: {
            occurrenceDate: { lt: today }
          }
        })
      : db.reservation.count({
          where: {
            archivedAt: null,
            fulfillmentDate: { lt: today }
          }
        }),
    subscriptionsEnabled
      ? db.reservationOccurrence.count({
          where: {
            status: 'CANCELLED',
            occurrenceDate: { gte: today }
          }
        })
      : db.reservation.count({
          where: {
            status: 'CANCELLED',
            archivedAt: null,
            fulfillmentDate: { gte: today }
          }
        }),
    db.reservation.count({ where: { archivedAt: { not: null } } }),
    db.reservation.count({ where: { status: 'REJECTED', archivedAt: null } })
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
