import { prisma } from '../../../../../prisma/client'
import { removeReservationFromGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail, buildReservationDecisionEmail } from '~/server/utils/reservationEmails'
import { applyTemplateVars, getReservationEmailHtmlLang, resolveTemplateFromSettings } from '~/server/utils/reservationEmailContent'
import { getReservationNotificationEmail, isSubscriptionsEnabled } from '~/server/utils/settings'
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
    throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })
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
        ? 'Abonnement arrêté par le client'
        : 'Réservation annulée par le client'
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
        ? 'Abonnement arrêté par le client'
        : 'Réservation annulée par le client'
    }
  })

  const customerTemplate = await resolveTemplateFromSettings(
    subscriptionsEnabled && updated.monthlySubscription ? 'stopped_subscription' : 'cancelled_by_customer',
    updated.language
  )
  const customerDraft = applyTemplateVars(customerTemplate, {
    customerName: updated.customerName
  })

  const customerEmail = await buildReservationDecisionEmail({
    reservation: updated,
    subject: customerDraft.subject,
    body: customerDraft.body,
    action: 'CANCELLED',
    subscriptionsEnabled
  })

  await sendGmail({
    to: updated.email,
    subject: customerDraft.subject,
    body: customerEmail.textBody,
    htmlBody: customerEmail.htmlBody,
    calendarInvite: customerEmail.calendarInvite,
    attachments: customerEmail.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: subscriptionsEnabled && updated.monthlySubscription ? 'CUSTOMER_STOPPED_SUBSCRIPTION' : 'CUSTOMER_CANCELLED',
    recipientEmail: updated.email,
    subject: customerDraft.subject,
    summary: customerDraft.body
  })

  const reservationNotificationEmail = await getReservationNotificationEmail()
  if (reservationNotificationEmail) {
    const adminTemplate = await resolveTemplateFromSettings(
      subscriptionsEnabled && updated.monthlySubscription ? 'admin_customer_stopped_subscription' : 'admin_customer_cancelled',
      'fr'
    )
    const adminDraft = applyTemplateVars(adminTemplate, {
      contextLine: subscriptionsEnabled && updated.monthlySubscription
        ? 'Le client a arrêté son abonnement.'
        : 'Le client a annulé sa réservation.',
      basketName: updated.basket.name,
      customerName: updated.customerName,
      customerEmail: updated.email
    })

    await sendGmail({
      to: reservationNotificationEmail,
      subject: adminDraft.subject,
      body: adminDraft.body,
      htmlBody: buildGenericEmail({
        title: adminDraft.subject,
        body: adminDraft.body,
        accent: '#d97706',
        lang: getReservationEmailHtmlLang('fr')
      })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: subscriptionsEnabled && updated.monthlySubscription ? 'ADMIN_NOTIFIED_CUSTOMER_STOP' : 'ADMIN_NOTIFIED_CUSTOMER_CANCEL',
      recipientEmail: reservationNotificationEmail,
      subject: adminDraft.subject,
      summary: adminDraft.body
    })
  }

  return { ok: true, cancelled: true }
})
