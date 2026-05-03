import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail, buildReservationDecisionEmail } from '~/server/utils/reservationEmails'
import { removeReservationFromGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { getSetting, SETTING_KEYS } from '~/server/utils/settings'
import { logReservationNotification } from '~/server/utils/reservationNotifications'
import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  if (!SUBSCRIPTIONS_ENABLED) {
    throw createError({ statusCode: 410, statusMessage: 'Les abonnements ne sont pas actifs pour le moment.' })
  }

  const token = String(getRouterParam(event, 'token') ?? '')
  if (!token) throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })

  const reservation = await prisma.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  if (reservation.status === 'CANCELLED' || !reservation.subscriptionActive) {
    return { ok: true, alreadyStopped: true }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: 'CANCELLED',
      subscriptionActive: false,
      subscriptionCancelledAt: new Date(),
      cancelledByCustomerAt: new Date(),
      adminNote: 'Abonnement arrete par le client'
    },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  if (updated.googleCalendarEventId) {
    await removeReservationFromGoogleCalendar(updated)
  }

  await prisma.reservationOccurrence.updateMany({
    where: { reservationId: reservation.id, status: 'SCHEDULED' },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Abonnement arrete par le client'
    }
  })

  const subject = 'Votre abonnement a ete arrete - Ferme du Campeyrigoux'
  const body = `Bonjour ${updated.customerName},

Votre abonnement a bien ete arrete.

Merci pour votre confiance.`

  const customerEmail = await buildReservationDecisionEmail({
    reservation: updated,
    subject,
    body,
    action: 'CANCELLED'
  })

  await sendGmail({
    to: updated.email,
    subject,
    body: customerEmail.textBody,
    htmlBody: customerEmail.htmlBody,
    calendarInvite: customerEmail.calendarInvite,
    attachments: customerEmail.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: 'CUSTOMER_STOPPED_SUBSCRIPTION',
    recipientEmail: updated.email,
    subject,
    summary: body
  })

  const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
  if (adminEmail) {
    const adminSubject = `Abonnement arrete par le client - ${updated.basket.name}`
    const adminBody = `Le client a arrete son abonnement.

- Panier : ${updated.basket.name}
- Client : ${updated.customerName}
- Email : ${updated.email}`

    await sendGmail({
      to: adminEmail,
      subject: adminSubject,
      body: adminBody,
      htmlBody: buildGenericEmail({ title: adminSubject, body: adminBody, accent: '#d97706' })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: 'ADMIN_NOTIFIED_CUSTOMER_STOP',
      recipientEmail: adminEmail,
      subject: adminSubject,
      summary: adminBody
    })
  }

  return { ok: true, stopped: true }
})
