import { prisma } from '../../../../prisma/client'
import { isSubscriptionsEnabled } from '~/server/utils/settings'

function toPositiveInt(value: unknown, fallback: number, max = 50) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, 'token') ?? '')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })
  }
  const query = getQuery(event)
  const occurrencePage = toPositiveInt(query.occurrencePage, 1)
  const occurrenceLimit = toPositiveInt(query.occurrenceLimit, 5)
  const subscriptionsEnabled = await isSubscriptionsEnabled()

  const reservation = await prisma.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: { select: { id: true, name: true, finalPrice: true } },
      occurrences: subscriptionsEnabled
        ? {
            where: { status: 'SCHEDULED' },
            orderBy: { occurrenceDate: 'asc' },
            skip: (occurrencePage - 1) * occurrenceLimit,
            take: occurrenceLimit
          }
        : false,
      scheduleProposals: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!reservation) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  }

  const occurrenceTotal = subscriptionsEnabled
    ? await prisma.reservationOccurrence.count({
        where: { reservationId: reservation.id, status: 'SCHEDULED' }
      })
    : 0

  return {
    id: reservation.id,
    customerName: reservation.customerName,
    email: reservation.email,
    status: reservation.status,
    deliveryType: reservation.deliveryType,
    monthlySubscription: subscriptionsEnabled ? reservation.monthlySubscription : false,
    subscriptionActive: subscriptionsEnabled ? reservation.subscriptionActive : false,
    fulfillmentDate: reservation.fulfillmentDate,
    fulfillmentTime: reservation.fulfillmentTime,
    fulfillmentLocation: reservation.fulfillmentLocation,
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
    occurrences: (reservation.occurrences ?? []).map((occurrence) => ({
      id: occurrence.id,
      occurrenceDate: occurrence.occurrenceDate,
      occurrenceTime: occurrence.occurrenceTime,
      occurrenceLocation: occurrence.occurrenceLocation
    })),
    occurrencePagination: {
      page: occurrencePage,
      perPage: occurrenceLimit,
      total: occurrenceTotal,
      totalPages: Math.max(1, Math.ceil(occurrenceTotal / occurrenceLimit))
    },
    basket: {
      id: reservation.basket.id,
      name: reservation.basket.name,
      finalPrice: Number(reservation.basket.finalPrice)
    },
    subscriptionsEnabled
  }
})
