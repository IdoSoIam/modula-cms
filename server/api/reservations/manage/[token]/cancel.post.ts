import { prisma } from '../../../../../prisma/client'
import { removeReservationFromGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail, buildReservationDecisionEmail } from '~/server/utils/reservationEmails'
import { getSetting, SETTING_KEYS, isSubscriptionsEnabled } from '~/server/utils/settings'
import { logReservationNotification } from '~/server/utils/reservationNotifications'

export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, 'token') ?? '')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  if (!reservation) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  }
  const subscriptionsEnabled = await isSubscriptionsEnabled()

  if (reservation.status === 'CANCELLED') {
    return { ok: true, alreadyCancelled: true }
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: 'CANCELLED',
      subscriptionActive: subscriptionsEnabled ? false : reservation.subscriptionActive,
      subscriptionCancelledAt: subscriptionsEnabled && reservation.monthlySubscription ? new Date() : reservation.subscriptionCancelledAt,
      cancelledByCustomerAt: new Date(),
      adminNote: subscriptionsEnabled && reservation.monthlySubscription
        ? 'Abonnement arrete par le client'
        : 'Reservation annulee par le client'
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
      cancellationReason: subscriptionsEnabled && reservation.monthlySubscription
        ? 'Abonnement arrete par le client'
        : 'Reservation annulee par le client'
    }
  })

  const customerSubject = subscriptionsEnabled && updated.monthlySubscription
    ? 'Votre abonnement a ete arrete - Ferme du Campeyrigoux'
    : 'Votre reservation a ete annulee - Ferme du Campeyrigoux'
  const customerBody = subscriptionsEnabled && updated.monthlySubscription
    ? `Bonjour ${updated.customerName},

Votre abonnement a bien ete arrete.

Si besoin, vous pouvez nous recontacter pour remettre en place une livraison plus tard.`
    : `Bonjour ${updated.customerName},

Votre reservation a bien ete annulee.

Si besoin, vous pouvez nous recontacter pour refaire une demande ulterieurement.`

  const customerEmail = await buildReservationDecisionEmail({
    reservation: updated,
    subject: customerSubject,
    body: customerBody,
    action: 'CANCELLED',
    subscriptionsEnabled
  })

  await sendGmail({
    to: updated.email,
    subject: customerSubject,
    body: customerEmail.textBody,
    htmlBody: customerEmail.htmlBody,
    calendarInvite: customerEmail.calendarInvite,
    attachments: customerEmail.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: subscriptionsEnabled && updated.monthlySubscription ? 'CUSTOMER_STOPPED_SUBSCRIPTION' : 'CUSTOMER_CANCELLED',
    recipientEmail: updated.email,
    subject: customerSubject,
    summary: customerBody
  })

  const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
  if (adminEmail) {
    const subject = subscriptionsEnabled && updated.monthlySubscription
      ? `Abonnement arrete par le client - ${updated.basket.name}`
      : `Reservation annulee par le client - ${updated.basket.name}`
    const body = `${subscriptionsEnabled && updated.monthlySubscription ? 'Le client a arrete son abonnement.' : 'Le client a annule sa reservation.'}

- Panier : ${updated.basket.name}
- Client : ${updated.customerName}
- Email : ${updated.email}`

    await sendGmail({
      to: adminEmail,
      subject,
      body,
      htmlBody: buildGenericEmail({
        title: subject,
        body,
        accent: '#d97706'
      })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: subscriptionsEnabled && updated.monthlySubscription ? 'ADMIN_NOTIFIED_CUSTOMER_STOP' : 'ADMIN_NOTIFIED_CUSTOMER_CANCEL',
      recipientEmail: adminEmail,
      subject,
      summary: body
    })
  }

  return { ok: true, cancelled: true }
})
