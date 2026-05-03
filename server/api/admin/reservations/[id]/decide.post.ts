import { requireAdmin } from '~/server/utils/requireAdmin'
import { sendGmail } from '~/server/utils/gmail'
import { removeReservationFromGoogleCalendar, syncReservationToGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { buildReservationDecisionEmail } from '~/server/utils/reservationEmails'
import { logReservationNotification } from '~/server/utils/reservationNotifications'
import { ensureReservationOccurrences, updateFutureOccurrencesFromReservation } from '~/server/utils/reservationOccurrences'
import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'
import { prisma } from '../../../../../prisma/client'

interface Body {
  decision: 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  adminNote?: string
  fulfillmentDate?: string | null
  fulfillmentTime?: string | null
  fulfillmentLocation?: string | null
  email: { subject: string; body: string }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<Body>(event)
  if (!['CONFIRMED', 'REJECTED', 'CANCELLED'].includes(body.decision)) {
    throw createError({ statusCode: 400, statusMessage: 'Decision invalide' })
  }
  if (!body.email?.subject || !body.email?.body) {
    throw createError({ statusCode: 400, statusMessage: 'Email vide' })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: body.decision,
      adminNote: body.adminNote ?? null,
      fulfillmentDate: body.decision === 'CONFIRMED'
        ? (body.fulfillmentDate ? new Date(`${body.fulfillmentDate}T12:00:00`) : reservation.fulfillmentDate)
        : reservation.fulfillmentDate,
      fulfillmentTime: body.decision === 'CONFIRMED'
        ? (body.fulfillmentTime?.trim() || reservation.fulfillmentTime)
        : reservation.fulfillmentTime,
      fulfillmentLocation: body.decision === 'CONFIRMED'
        ? (body.fulfillmentLocation?.trim() || reservation.fulfillmentLocation)
        : reservation.fulfillmentLocation,
      confirmedAt: body.decision === 'CONFIRMED' ? new Date() : reservation.confirmedAt,
      subscriptionActive: !SUBSCRIPTIONS_ENABLED
        ? false
        : body.decision === 'CONFIRMED'
          ? reservation.monthlySubscription
          : body.decision === 'CANCELLED' && reservation.monthlySubscription
            ? false
            : reservation.subscriptionActive,
      subscriptionCancelledAt: !SUBSCRIPTIONS_ENABLED
        ? reservation.subscriptionCancelledAt
        : body.decision === 'CONFIRMED'
          ? reservation.monthlySubscription ? null : reservation.subscriptionCancelledAt
          : body.decision === 'CANCELLED' && reservation.monthlySubscription
            ? new Date()
            : reservation.subscriptionCancelledAt
    },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  let calendarSynced = false
  let calendarRemoved = false
  let calendarReason: string | null = null

  if (body.decision === 'CONFIRMED') {
    await ensureReservationOccurrences(updated)
    if (SUBSCRIPTIONS_ENABLED) {
      await updateFutureOccurrencesFromReservation(updated)
    }
    try {
      const result = await syncReservationToGoogleCalendar(updated)
      calendarSynced = result.synced
      calendarReason = result.reason
    } catch (e: any) {
      calendarReason = `Erreur sync: ${e.message}`
      console.error('Erreur sync Google Calendar:', e)
    }
  } else {
    await prisma.reservationOccurrence.updateMany({
      where: {
        reservationId: reservation.id,
        status: 'SCHEDULED'
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: body.decision === 'CANCELLED' ? 'Reservation annulee' : 'Reservation refusee'
      }
    })
  }

  if (body.decision !== 'CONFIRMED' && reservation.googleCalendarEventId) {
    const result = await removeReservationFromGoogleCalendar(reservation)
    calendarRemoved = result.removed
  }

  const emailPayload = await buildReservationDecisionEmail({
    reservation: updated,
    subject: body.email.subject,
    body: body.email.body,
    action: body.decision
  })

  await sendGmail({
    to: reservation.email,
    subject: body.email.subject,
    body: emailPayload.textBody,
    htmlBody: emailPayload.htmlBody,
    calendarInvite: emailPayload.calendarInvite,
    attachments: emailPayload.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: body.decision === 'CONFIRMED'
      ? reservation.status === 'CONFIRMED' ? 'UPDATED' : 'CONFIRMED'
      : body.decision,
    recipientEmail: reservation.email,
    subject: body.email.subject,
    summary: body.email.body
  })

  return { ok: true, status: updated.status, calendarSynced, calendarRemoved, calendarReason }
})
