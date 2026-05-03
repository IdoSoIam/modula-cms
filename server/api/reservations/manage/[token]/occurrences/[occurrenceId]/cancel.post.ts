import { prisma } from '../../../../../../../prisma/client'
import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail, buildReservationOccurrenceEmail } from '~/server/utils/reservationEmails'
import { cancelReservationOccurrenceInGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { getSetting, SETTING_KEYS } from '~/server/utils/settings'
import { logReservationNotification } from '~/server/utils/reservationNotifications'

function formatOccurrenceDate(value: Date) {
  return value.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, 'token') ?? '')
  const occurrenceId = Number(getRouterParam(event, 'occurrenceId'))
  if (!token || !occurrenceId) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true,
      occurrences: true
    }
  })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })

  const occurrence = reservation.occurrences.find((item) => item.id === occurrenceId)
  if (!occurrence) throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })
  if (occurrence.status === 'CANCELLED') return { ok: true, alreadyCancelled: true }

  const updatedOccurrence = await prisma.reservationOccurrence.update({
    where: { id: occurrence.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Occurrence annulee par le client'
    }
  })

  try {
    await cancelReservationOccurrenceInGoogleCalendar(reservation, updatedOccurrence)
  } catch (error) {
    console.error('Erreur annulation Google Calendar occurrence client:', error)
  }

  const customerSubject = 'Votre livraison de cette semaine a ete annulee - Ferme du Campeyrigoux'
  const customerBody = `Bonjour ${reservation.customerName},

Votre occurrence de cette semaine a bien ete annulee.

Votre abonnement reste actif pour les semaines suivantes.`

  const customerEmail = await buildReservationOccurrenceEmail({
    reservation,
    occurrence: updatedOccurrence,
    subject: customerSubject,
    body: customerBody,
    action: 'CANCELLED'
  })

  await sendGmail({
    to: reservation.email,
    subject: customerSubject,
    body: customerEmail.textBody,
    htmlBody: customerEmail.htmlBody,
    calendarInvite: customerEmail.calendarInvite,
    attachments: customerEmail.attachments
  })

  await logReservationNotification({
    reservationId: reservation.id,
    occurrenceId: occurrence.id,
    kind: 'CUSTOMER_CANCELLED_OCCURRENCE',
    recipientEmail: reservation.email,
    subject: customerSubject,
    summary: customerBody
  })

  const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
  if (adminEmail) {
    const subject = `Occurrence annulee par le client - ${reservation.basket.name}`
    const body = `Le client a annule une occurrence de son abonnement.

- Panier : ${reservation.basket.name}
- Client : ${reservation.customerName}
- Email : ${reservation.email}
- Date : ${formatOccurrenceDate(occurrence.occurrenceDate)}
- Heure : ${occurrence.occurrenceTime ?? reservation.fulfillmentTime ?? 'Heure a confirmer'}
- Lieu : ${occurrence.occurrenceLocation ?? reservation.fulfillmentLocation ?? 'Lieu a confirmer'}`

    await sendGmail({
      to: adminEmail,
      subject,
      body,
      htmlBody: buildGenericEmail({ title: subject, body, accent: '#d97706' })
    })
  }

  return { ok: true, cancelled: true }
})
