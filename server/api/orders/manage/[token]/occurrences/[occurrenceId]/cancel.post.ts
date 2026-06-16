import { db } from '#modula/server/data/client'
import { formatDateForTimeZone } from '#modula/server/utils/dateFormat'
import { sendGmail } from '#modula/server/utils/gmail'
import { buildGenericEmail, buildReservationOccurrenceEmail } from '#modula/server/utils/orderEmails'
import { applyTemplateVars, getReservationEmailHtmlLang, resolveTemplateFromSettings } from '#modula/server/utils/orderEmailContent'
import { cancelReservationOccurrenceInGoogleCalendar } from '#modula/server/utils/googleCalendarSync'
import { getReservationNotificationEmail, isSubscriptionsEnabled } from '#modula/server/utils/settings'
import { logReservationNotification } from '#modula/server/utils/orderNotifications'

function formatOccurrenceDate(value: Date) {
  return formatDateForTimeZone(value, 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export default defineEventHandler(async (event) => {
  const subscriptionsEnabled = await isSubscriptionsEnabled()
  if (!subscriptionsEnabled) {
    throw createError({ statusCode: 410, statusMessage: 'Les abonnements ne sont pas actifs pour le moment.' })
  }

  const token = String(getRouterParam(event, 'token') ?? '')
  const occurrenceId = Number(getRouterParam(event, 'occurrenceId'))
  if (!token || !occurrenceId) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })
  }

  const reservation = await db.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true,
      occurrences: true
    }
  })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })

  const occurrence = reservation.occurrences.find((item) => item.id === occurrenceId)
  if (!occurrence) throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })
  if (occurrence.status === 'CANCELLED') return { ok: true, alreadyCancelled: true }

  const updatedOccurrence = await db.reservationOccurrence.update({
    where: { id: occurrence.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Occurrence annulée par le client'
    }
  })

  try {
    await cancelReservationOccurrenceInGoogleCalendar(reservation, updatedOccurrence)
  } catch (error) {
    console.error('Erreur annulation Google Calendar occurrence client:', error)
  }

  const customerTemplate = await resolveTemplateFromSettings('cancelled_occurrence', reservation.language)
  const customerDraft = applyTemplateVars(customerTemplate, {
    customerName: reservation.customerName,
    basketName: reservation.basket.name
  })

  const customerEmail = await buildReservationOccurrenceEmail({
    reservation,
    occurrence: updatedOccurrence,
    subject: customerDraft.subject,
    body: customerDraft.body,
    action: 'CANCELLED',
    subscriptionsEnabled,
    manageLinkMode: 'manage'
  })

  await sendGmail({
    to: reservation.email,
    subject: customerDraft.subject,
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
    subject: customerDraft.subject,
    summary: customerDraft.body
  })

  const reservationNotificationEmail = await getReservationNotificationEmail()
  if (reservationNotificationEmail) {
    const adminTemplate = await resolveTemplateFromSettings('admin_customer_cancelled_occurrence', 'fr')
    const adminDraft = applyTemplateVars(adminTemplate, {
      contextLine: 'Le client a annulé une occurrence de son abonnement.',
      basketName: reservation.basket.name,
      customerName: reservation.customerName,
      customerEmail: reservation.email,
      fulfillmentDate: formatOccurrenceDate(occurrence.occurrenceDate),
      fulfillmentTime: occurrence.occurrenceTime ?? reservation.fulfillmentTime ?? 'Heure à confirmer',
      fulfillmentLocation: occurrence.occurrenceLocation ?? reservation.fulfillmentLocation ?? 'Lieu à confirmer'
    })

    await sendGmail({
      to: reservationNotificationEmail,
      subject: adminDraft.subject,
      body: adminDraft.body,
      htmlBody: buildGenericEmail({ title: adminDraft.subject, body: adminDraft.body, accent: '#d97706', lang: getReservationEmailHtmlLang('fr') })
    })
  }

  return { ok: true, cancelled: true }
})
