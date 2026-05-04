import { prisma } from '../../../../../prisma/client'
import { sendGmail } from '~/server/utils/gmail'
import { buildAdminReservationSummary, buildGenericEmail, buildReservationDecisionEmail } from '~/server/utils/reservationEmails'
import { logReservationNotification } from '~/server/utils/reservationNotifications'
import { ensureReservationOccurrences } from '~/server/utils/reservationOccurrences'
import { markReservationProposalAccepted } from '~/server/utils/reservationScheduleProposals'
import { syncReservationToGoogleCalendar } from '~/server/utils/googleCalendarSync'
import { getSetting, isSubscriptionsEnabled, SETTING_KEYS } from '~/server/utils/settings'

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
    throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  }
  if (reservation.deliveryType !== 'FARM' || reservation.scheduleProposalPendingBy !== 'CUSTOMER') {
    throw createError({ statusCode: 409, statusMessage: 'Aucune proposition en attente de votre confirmation' })
  }
  if (!reservation.fulfillmentDate || !reservation.fulfillmentTime) {
    throw createError({ statusCode: 409, statusMessage: 'Le creneau propose est incomplet' })
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

  const subject = 'Votre retrait a la ferme est confirme - Ferme du Campeyrigoux'
  const body = `Bonjour ${updated.customerName},

Votre reservation est maintenant confirmee pour le creneau suivant :

- Date : ${updated.fulfillmentDate.toLocaleDateString('fr-FR')}
- Heure : ${updated.fulfillmentTime}
- Lieu : ${updated.fulfillmentLocation ?? 'Ferme du Campeyrigoux'}

Le paiement se fait en especes au retrait.`

  const emailPayload = await buildReservationDecisionEmail({
    reservation: updated,
    subject,
    body,
    action: 'CONFIRMED',
    subscriptionsEnabled
  })

  await sendGmail({
    to: updated.email,
    subject,
    body: emailPayload.textBody,
    htmlBody: emailPayload.htmlBody,
    calendarInvite: emailPayload.calendarInvite,
    attachments: emailPayload.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: 'CUSTOMER_ACCEPTED_SCHEDULE_PROPOSAL',
    recipientEmail: updated.email,
    subject,
    summary: body
  })

  const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
  if (adminEmail) {
    const adminSubject = `Proposition acceptee par le client - ${updated.basket.name}`
    const adminBody = buildAdminReservationSummary({
      reservationId: updated.id,
      basketName: updated.basket.name,
      customerName: updated.customerName,
      customerEmail: updated.email,
      customerPhone: updated.phone,
      customerMessage: updated.message,
      deliveryLabel: 'Retrait a la ferme',
      fulfillmentDate: updated.fulfillmentDate,
      fulfillmentTime: updated.fulfillmentTime,
      fulfillmentLocation: updated.fulfillmentLocation,
      contextLine: 'Le client a accepte la proposition de creneau envoyee par la ferme.'
    })

    await sendGmail({
      to: adminEmail,
      subject: adminSubject,
      body: adminBody,
      htmlBody: buildGenericEmail({
        title: adminSubject,
        body: adminBody,
        accent: '#4f8a34'
      })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: 'ADMIN_NOTIFIED_CUSTOMER_ACCEPTED_SCHEDULE_PROPOSAL',
      recipientEmail: adminEmail,
      subject: adminSubject,
      summary: adminBody
    })
  }

  return { ok: true, status: updated.status, calendarSynced: calendarResult.synced }
})
