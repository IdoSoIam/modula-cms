import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail, buildReservationDecisionEmail } from '~/server/utils/reservationEmails'
import { applyTemplateVars, getReservationEmailHtmlLang, resolveTemplateFromSettings } from '~/server/utils/reservationEmailContent'
import { removeReservationFromGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { getReservationNotificationEmail, isSubscriptionsEnabled } from '~/server/utils/settings'
import { logReservationNotification } from '~/server/utils/reservationNotifications'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  const subscriptionsEnabled = await isSubscriptionsEnabled()
  if (!subscriptionsEnabled) {
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
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })
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
      adminNote: 'Abonnement arrêté par le client'
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
      cancellationReason: 'Abonnement arrêté par le client'
    }
  })

  const customerTemplate = await resolveTemplateFromSettings('stopped_subscription', updated.language)
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
    kind: 'CUSTOMER_STOPPED_SUBSCRIPTION',
    recipientEmail: updated.email,
    subject: customerDraft.subject,
    summary: customerDraft.body
  })

  const reservationNotificationEmail = await getReservationNotificationEmail()
  if (reservationNotificationEmail) {
    const adminTemplate = await resolveTemplateFromSettings('admin_customer_stopped_subscription', 'fr')
    const adminDraft = applyTemplateVars(adminTemplate, {
      contextLine: 'Le client a arrêté son abonnement.',
      basketName: updated.basket.name,
      customerName: updated.customerName,
      customerEmail: updated.email
    })

    await sendGmail({
      to: reservationNotificationEmail,
      subject: adminDraft.subject,
      body: adminDraft.body,
      htmlBody: buildGenericEmail({ title: adminDraft.subject, body: adminDraft.body, accent: '#d97706', lang: getReservationEmailHtmlLang('fr') })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: 'ADMIN_NOTIFIED_CUSTOMER_STOP',
      recipientEmail: reservationNotificationEmail,
      subject: adminDraft.subject,
      summary: adminDraft.body
    })
  }

  return { ok: true, stopped: true }
})
