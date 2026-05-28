import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../../prisma/client'
import { buildReservationOccurrenceEmail } from '#modula/server/utils/orderEmails'
import { sendGmail } from '#modula/server/utils/gmail'
import { logReservationNotification } from '#modula/server/utils/orderNotifications'
import { syncReservationOccurrenceToGoogleCalendar } from '#modula/server/utils/googleCalendarSync'
import { isSubscriptionsEnabled } from '#modula/server/utils/settings'

interface Body {
  occurrenceDate: string
  occurrenceTime?: string | null
  occurrenceLocation?: string | null
  email: { subject: string; body: string }
}

export default defineEventHandler(async (event) => {
  const subscriptionsEnabled = await isSubscriptionsEnabled()
  if (!subscriptionsEnabled) {
    throw createError({ statusCode: 410, statusMessage: 'Les abonnements ne sont pas actifs pour le moment.' })
  }

  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<Body>(event)
  const occurrence = await prisma.reservationOccurrence.findUnique({
    where: { id },
    include: {
      reservation: {
        include: {
          basket: true,
          pickupPoint: true,
          deliveryTour: true
        }
      }
    }
  })

  if (!occurrence) throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })

  const updatedOccurrence = await prisma.reservationOccurrence.update({
    where: { id },
    data: {
      occurrenceDate: new Date(`${body.occurrenceDate}T12:00:00`),
      originalOccurrenceDate: occurrence.originalOccurrenceDate ?? occurrence.occurrenceDate,
      occurrenceTime: body.occurrenceTime?.trim() || null,
      occurrenceLocation: body.occurrenceLocation?.trim() || null,
      customSchedule: true,
      status: 'SCHEDULED',
      cancelledAt: null,
      cancellationReason: null
    }
  })

  try {
    await syncReservationOccurrenceToGoogleCalendar(occurrence.reservation, updatedOccurrence, subscriptionsEnabled)
  } catch (error) {
    console.error('Erreur sync Google Calendar occurrence:', error)
  }

  const emailPayload = await buildReservationOccurrenceEmail({
    reservation: occurrence.reservation,
    occurrence: updatedOccurrence,
    subject: body.email.subject,
    body: body.email.body,
    action: 'CONFIRMED',
    recurrenceId: occurrence.originalOccurrenceDate ?? occurrence.occurrenceDate,
    subscriptionsEnabled,
    manageLinkMode: 'manage'
  })

  await sendGmail({
    to: occurrence.reservation.email,
    subject: body.email.subject,
    body: emailPayload.textBody,
    htmlBody: emailPayload.htmlBody,
    calendarInvite: emailPayload.calendarInvite,
    attachments: emailPayload.attachments
  })

  await logReservationNotification({
    reservationId: occurrence.reservationId,
    occurrenceId: occurrence.id,
    kind: 'OCCURRENCE_UPDATED',
    recipientEmail: occurrence.reservation.email,
    subject: body.email.subject,
    summary: body.email.body
  })

  return { ok: true, occurrenceId: updatedOccurrence.id }
})
