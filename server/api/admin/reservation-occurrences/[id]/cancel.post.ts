import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../../prisma/client'
import { buildReservationOccurrenceEmail } from '~/server/utils/reservationEmails'
import { sendGmail } from '~/server/utils/gmail'
import { logReservationNotification } from '~/server/utils/reservationNotifications'
import { cancelReservationOccurrenceInGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'

interface Body {
  email: { subject: string; body: string }
}

export default defineEventHandler(async (event) => {
  if (!SUBSCRIPTIONS_ENABLED) {
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
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Occurrence annulee par l admin'
    }
  })

  try {
    await cancelReservationOccurrenceInGoogleCalendar(occurrence.reservation, updatedOccurrence)
  } catch (error) {
    console.error('Erreur annulation Google Calendar occurrence:', error)
  }

  const emailPayload = await buildReservationOccurrenceEmail({
    reservation: occurrence.reservation,
    occurrence: updatedOccurrence,
    subject: body.email.subject,
    body: body.email.body,
    action: 'CANCELLED',
    recurrenceId: occurrence.originalOccurrenceDate ?? occurrence.occurrenceDate
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
    kind: 'OCCURRENCE_CANCELLED',
    recipientEmail: occurrence.reservation.email,
    subject: body.email.subject,
    summary: body.email.body
  })

  return { ok: true, occurrenceId: updatedOccurrence.id }
})
