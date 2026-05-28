import { prisma } from '../../../../../prisma/client'
import { formatDateLabel } from '#modula/server/utils/dateFormat'
import { sendGmail } from '#modula/server/utils/gmail'
import { buildGenericEmail, buildReservationDecisionEmail, getAdminReservationUrl } from '#modula/server/utils/orderEmails'
import { applyTemplateVars, getReservationEmailHtmlLang, resolveTemplateFromSettings } from '#modula/server/utils/orderEmailContent'
import { logReservationNotification } from '#modula/server/utils/orderNotifications'
import { ensureReservationOccurrences } from '#modula/server/utils/orderOccurrences'
import { markReservationProposalAccepted } from '#modula/server/utils/orderScheduleProposals'
import { syncReservationToGoogleCalendar } from '#modula/server/utils/googleCalendarSync'
import { getDeliveryMethodLabel } from '#modula/server/utils/orderFulfillment'
import { getReservationNotificationEmail, isSubscriptionsEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, 'token') ?? '')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })
  }

  const subscriptionsEnabled = await isSubscriptionsEnabled()
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
  if (reservation.deliveryType !== 'FARM' || reservation.scheduleProposalPendingBy !== 'CUSTOMER') {
    throw createError({ statusCode: 409, statusMessage: 'Aucune proposition en attente de votre confirmation' })
  }
  if (!reservation.fulfillmentDate || !reservation.fulfillmentTime) {
    throw createError({ statusCode: 409, statusMessage: 'Le créneau proposé est incomplet' })
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status: 'CONFIRMED',
      confirmedAt: new Date(),
      scheduleProposalPendingBy: null,
      scheduleProposalAcceptedAt: new Date()
    },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  await markReservationProposalAccepted({
    reservationId: updated.id,
    proposalDate: updated.fulfillmentDate!,
    proposalTime: updated.fulfillmentTime!
  })

  await ensureReservationOccurrences(updated, subscriptionsEnabled)
  const calendarResult = await syncReservationToGoogleCalendar(updated, subscriptionsEnabled)

  const customerTemplate = await resolveTemplateFromSettings('accepted_proposal', updated.language)
  const customerEmailDraft = applyTemplateVars(customerTemplate, {
    customerName: updated.customerName,
    fulfillmentDate: updated.fulfillmentDate
      ? formatDateLabel(updated.fulfillmentDate, updated.language === 'en' ? 'en-US' : 'fr-FR')
      : (updated.language === 'en' ? 'to be confirmed' : 'à confirmer'),
    fulfillmentTime: updated.fulfillmentTime ?? (updated.language === 'en' ? 'to be confirmed' : 'à confirmer'),
    fulfillmentLocation: updated.fulfillmentLocation ?? 'Ferme du Campeyrigoux'
  })

  const emailPayload = await buildReservationDecisionEmail({
    reservation: updated,
    subject: customerEmailDraft.subject,
    body: customerEmailDraft.body,
    action: 'CONFIRMED',
    subscriptionsEnabled,
    manageLinkMode: 'cancel'
  })

  await sendGmail({
    to: updated.email,
    subject: customerEmailDraft.subject,
    body: emailPayload.textBody,
    htmlBody: emailPayload.htmlBody,
    calendarInvite: emailPayload.calendarInvite,
    attachments: emailPayload.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: 'CUSTOMER_ACCEPTED_SCHEDULE_PROPOSAL',
    recipientEmail: updated.email,
    subject: customerEmailDraft.subject,
    summary: customerEmailDraft.body
  })

  const reservationNotificationEmail = await getReservationNotificationEmail()
  if (reservationNotificationEmail) {
    const adminTemplate = await resolveTemplateFromSettings('admin_customer_accepted_proposal', 'fr')
    const adminDraft = applyTemplateVars(adminTemplate, {
      contextLine: 'Le client a accepté la proposition de créneau envoyée par la ferme.',
      reservationId: String(updated.id),
      basketName: updated.basket.name,
      customerName: updated.customerName,
      customerEmail: updated.email,
      customerPhone: updated.phone ?? '-',
      customerMessage: updated.message ?? '-',
      deliveryMethod: getDeliveryMethodLabel(updated.deliveryType, 'fr'),
      fulfillmentDate: updated.fulfillmentDate ? formatDateLabel(updated.fulfillmentDate, 'fr-FR') : 'à confirmer',
      fulfillmentTime: updated.fulfillmentTime ?? 'à confirmer',
      fulfillmentLocation: updated.fulfillmentLocation ?? 'à confirmer',
      adminReservationUrl: getAdminReservationUrl(updated.id)
    })

    await sendGmail({
      to: reservationNotificationEmail,
      subject: adminDraft.subject,
      body: adminDraft.body,
      htmlBody: buildGenericEmail({
        title: adminDraft.subject,
        body: adminDraft.body,
        accent: '#4f8a34',
        lang: getReservationEmailHtmlLang('fr')
      })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: 'ADMIN_NOTIFIED_CUSTOMER_ACCEPTED_SCHEDULE_PROPOSAL',
      recipientEmail: reservationNotificationEmail,
      subject: adminDraft.subject,
      summary: adminDraft.body
    })
  }

  return { ok: true, status: updated.status, calendarSynced: calendarResult.synced }
})
