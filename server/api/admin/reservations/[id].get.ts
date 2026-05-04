import { requireAdmin } from '~/server/utils/requireAdmin'
import { ensureReservationOccurrences } from '~/server/utils/reservationOccurrences'
import { isSubscriptionsEnabled } from '~/server/utils/settings'
import { prisma } from '../../../../prisma/client'

function toPositiveInt(value: unknown, fallback: number, max = 100) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const query = getQuery(event)
  const occurrencePage = toPositiveInt(query.occurrencePage, 1)
  const occurrenceLimit = toPositiveInt(query.occurrenceLimit, 5, 50)
  const notificationPage = toPositiveInt(query.notificationPage, 1)
  const notificationLimit = toPositiveInt(query.notificationLimit, 5, 50)
  const subscriptionsEnabled = await isSubscriptionsEnabled()

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: { include: { cities: true } },
      scheduleProposals: { orderBy: { createdAt: 'asc' } }
    }
  })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })

  if (subscriptionsEnabled && reservation.status === 'CONFIRMED' && reservation.fulfillmentDate) {
    await ensureReservationOccurrences(reservation, subscriptionsEnabled)
  }

  const [occurrenceTotal, occurrences, notificationTotal, notifications] = await Promise.all([
    subscriptionsEnabled
      ? prisma.reservationOccurrence.count({
          where: {
            reservationId: id,
            occurrenceDate: { gte: today }
          }
        })
      : Promise.resolve(0),
    subscriptionsEnabled
      ? prisma.reservationOccurrence.findMany({
          where: {
            reservationId: id,
            occurrenceDate: { gte: today }
          },
          orderBy: { occurrenceDate: 'asc' },
          skip: (occurrencePage - 1) * occurrenceLimit,
          take: occurrenceLimit
        })
      : Promise.resolve([]),
    prisma.reservationNotification.count({ where: { reservationId: id } }),
    prisma.reservationNotification.findMany({
      where: { reservationId: id },
      orderBy: { createdAt: 'desc' },
      skip: (notificationPage - 1) * notificationLimit,
      take: notificationLimit
    })
  ])

  return {
    id: reservation.id,
    customerName: reservation.customerName,
    email: reservation.email,
    phone: reservation.phone,
    message: reservation.message,
    status: reservation.status,
    adminNote: reservation.adminNote,
    createdAt: reservation.createdAt,
    confirmedAt: reservation.confirmedAt,
    basket: { id: reservation.basket.id, name: reservation.basket.name, finalPrice: Number(reservation.basket.finalPrice) },
    deliveryType: reservation.deliveryType,
    deliveryAddress: reservation.deliveryAddress,
    deliveryCity: reservation.deliveryCity,
    deliveryPostalCode: reservation.deliveryPostalCode,
    fulfillmentDate: reservation.fulfillmentDate,
    fulfillmentTime: reservation.fulfillmentTime,
    fulfillmentLocation: reservation.fulfillmentLocation,
    monthlySubscription: subscriptionsEnabled ? reservation.monthlySubscription : false,
    subscriptionActive: subscriptionsEnabled ? reservation.subscriptionActive : false,
    subscriptionCancelledAt: reservation.subscriptionCancelledAt,
    scheduleProposalPendingBy: reservation.scheduleProposalPendingBy,
    scheduleProposalAcceptedAt: reservation.scheduleProposalAcceptedAt,
    scheduleProposals: reservation.scheduleProposals.map((proposal) => ({
      id: proposal.id,
      proposedBy: proposal.proposedBy,
      proposalDate: proposal.proposalDate,
      proposalTime: proposal.proposalTime,
      proposalLocation: proposal.proposalLocation,
      acceptedAt: proposal.acceptedAt,
      createdAt: proposal.createdAt
    })),
    googleCalendarEventId: reservation.googleCalendarEventId,
    googleCalendarSyncedAt: reservation.googleCalendarSyncedAt,
    occurrences: occurrences.map((o) => ({
      id: o.id,
      occurrenceDate: o.occurrenceDate,
      originalOccurrenceDate: o.originalOccurrenceDate,
      occurrenceTime: o.occurrenceTime,
      occurrenceLocation: o.occurrenceLocation,
      status: o.status,
      customSchedule: o.customSchedule,
      cancelledAt: o.cancelledAt,
      cancellationReason: o.cancellationReason
    })),
    occurrencePagination: {
      page: occurrencePage,
      perPage: occurrenceLimit,
      total: occurrenceTotal,
      totalPages: Math.max(1, Math.ceil(occurrenceTotal / occurrenceLimit))
    },
    notifications: notifications.map((n) => ({
      id: n.id,
      kind: n.kind,
      recipientEmail: n.recipientEmail,
      subject: n.subject,
      summary: n.summary,
      createdAt: n.createdAt,
      occurrenceId: n.occurrenceId
    })),
    notificationPagination: {
      page: notificationPage,
      perPage: notificationLimit,
      total: notificationTotal,
      totalPages: Math.max(1, Math.ceil(notificationTotal / notificationLimit))
    },
    pickupPoint: reservation.pickupPoint ? { id: reservation.pickupPoint.id, name: reservation.pickupPoint.name, address: reservation.pickupPoint.address } : null,
    deliveryTour: reservation.deliveryTour ? {
      id: reservation.deliveryTour.id,
      name: reservation.deliveryTour.name,
      dayOfWeek: reservation.deliveryTour.dayOfWeek,
      startTime: reservation.deliveryTour.startTime,
      endTime: reservation.deliveryTour.endTime,
      monthlyPrice: reservation.deliveryTour.monthlyPrice ? Number(reservation.deliveryTour.monthlyPrice) : null,
      cities: reservation.deliveryTour.cities.map((c) => c.city)
    } : null,
    subscriptionsEnabled
  }
})
