import { prisma } from '../../prisma/client'

export async function logReservationNotification(options: {
  reservationId: number
  occurrenceId?: number | null
  kind: string
  recipientEmail: string
  subject: string
  summary?: string | null
}) {
  await prisma.reservationNotification.create({
    data: {
      reservationId: options.reservationId,
      occurrenceId: options.occurrenceId ?? null,
      kind: options.kind,
      recipientEmail: options.recipientEmail,
      subject: options.subject,
      summary: options.summary ?? null
    }
  })
}
