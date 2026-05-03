import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../../prisma/client'
import { buildReservationOccurrenceEmail } from '~/server/utils/reservationEmails'
import { sendGmail } from '~/server/utils/gmail'
import { logReservationNotification } from '~/server/utils/reservationNotifications'

interface Body {
  occurrenceDate: string
  occurrenceTime?: string | null
  occurrenceLocation?: string | null
  email: { subject: string; body: string }
}

export default defineEventHandler(async (event) => {
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

  const emailPayload = await buildReservationOccurrenceEmail({
    reservation: occurrence.reservation,
    occurrence: updatedOccurrence,
    subject: body.email.subject,
    body: body.email.body,
    action: 'CONFIRMED',
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
    kind: 'OCCURRENCE_UPDATED',
    recipientEmail: occurrence.reservation.email,
    subject: body.email.subject,
    summary: body.email.body
  })

  return { ok: true, occurrenceId: updatedOccurrence.id }
})
