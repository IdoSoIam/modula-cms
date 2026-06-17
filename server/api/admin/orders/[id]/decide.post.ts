import { db } from '#modula/server/data/client'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { sendGmail } from '#modula/server/utils/gmail'
import { removeReservationFromGoogleCalendar, syncReservationToGoogleCalendar } from '#modula/server/utils/googleCalendarSync'
import { appendReservationManageLink, buildGenericEmail, buildReservationDecisionEmail } from '#modula/server/utils/orderEmails'
import { getReservationEmailHtmlLang } from '#modula/server/utils/orderEmailContent'
import { logReservationNotification } from '#modula/server/utils/orderNotifications'
import { ensureReservationOccurrences, updateFutureOccurrencesFromReservation } from '#modula/server/utils/orderOccurrences'
import { createReservationScheduleProposal, markReservationProposalAccepted, normalizeProposalDate, normalizeProposalTime } from '#modula/server/utils/orderScheduleProposals'
import { isSubscriptionsEnabled } from '#modula/server/utils/settings'

interface Body {
  decision: 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  scheduleMode?: 'CONFIRM' | 'PROPOSE'
  adminNote?: string
  fulfillmentDate?: string | null
  fulfillmentTime?: string | null
  fulfillmentLocation?: string | null
  email: { subject: string; body: string }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<Body>(event)
  const subscriptionsEnabled = await isSubscriptionsEnabled()
  if (!['CONFIRMED', 'REJECTED', 'CANCELLED'].includes(body.decision)) {
    throw createError({ statusCode: 400, statusMessage: 'Décision invalide' })
  }
  if (!body.email?.subject || !body.email?.body) {
    throw createError({ statusCode: 400, statusMessage: 'Email vide' })
  }

  const reservation = await db.reservation.findUnique({
    where: { id },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })

  const requestedDate = body.fulfillmentDate ? normalizeProposalDate(body.fulfillmentDate) : reservation.fulfillmentDate
  const requestedTime = normalizeProposalTime(body.fulfillmentTime) ?? reservation.fulfillmentTime
  const requestedLocation = body.fulfillmentLocation?.trim() || reservation.fulfillmentLocation

  if (body.decision === 'CONFIRMED' && body.scheduleMode === 'PROPOSE') {
    if (reservation.deliveryType !== 'FARM') {
      throw createError({ statusCode: 400, statusMessage: 'Les contre-propositions sont réservées au retrait à la ferme' })
    }
    if (!requestedDate || !requestedTime) {
      throw createError({ statusCode: 400, statusMessage: 'Date et heure requises pour une contre-proposition' })
    }

    await createReservationScheduleProposal({
      reservationId: reservation.id,
      proposedBy: 'ADMIN',
      proposalDate: requestedDate,
      proposalTime: requestedTime,
      proposalLocation: requestedLocation
    })

    const updated = await db.reservation.update({
      where: { id },
      data: {
        status: 'PENDING',
        adminNote: body.adminNote ?? null,
        fulfillmentDate: requestedDate,
        fulfillmentTime: requestedTime,
        fulfillmentLocation: requestedLocation,
        scheduleProposalPendingBy: 'CUSTOMER',
        lastScheduleProposalAt: new Date(),
        scheduleProposalAcceptedAt: null
      },
      include: {
        basket: true,
        pickupPoint: true,
        deliveryTour: true
      }
    })

    const textBody = appendReservationManageLink({
      body: body.email.body,
      reservation: updated,
      mode: 'respond',
      subscriptionsEnabled
    })

    await sendGmail({
      to: updated.email,
      subject: body.email.subject,
      body: textBody,
      htmlBody: await buildGenericEmail({
        title: body.email.subject,
        body: textBody,
        accent: '#2563eb',
        lang: getReservationEmailHtmlLang(updated.language)
      })
    })

    await logReservationNotification({
      reservationId: updated.id,
      kind: 'SCHEDULE_COUNTER_PROPOSED',
      recipientEmail: updated.email,
      subject: body.email.subject,
      summary: textBody
    })

    return { ok: true, status: updated.status, proposalPending: true }
  }

  const updated = await db.reservation.update({
    where: { id },
    data: {
      status: body.decision,
      adminNote: body.adminNote ?? null,
      fulfillmentDate: body.decision === 'CONFIRMED' ? requestedDate : reservation.fulfillmentDate,
      fulfillmentTime: body.decision === 'CONFIRMED' ? requestedTime : reservation.fulfillmentTime,
      fulfillmentLocation: body.decision === 'CONFIRMED' ? requestedLocation : reservation.fulfillmentLocation,
      confirmedAt: body.decision === 'CONFIRMED' ? new Date() : reservation.confirmedAt,
      subscriptionActive: !subscriptionsEnabled
        ? false
        : body.decision === 'CONFIRMED'
          ? reservation.monthlySubscription
          : body.decision === 'CANCELLED' && reservation.monthlySubscription
            ? false
            : reservation.subscriptionActive,
      subscriptionCancelledAt: !subscriptionsEnabled
        ? reservation.subscriptionCancelledAt
        : body.decision === 'CONFIRMED'
          ? reservation.monthlySubscription ? null : reservation.subscriptionCancelledAt
          : body.decision === 'CANCELLED' && reservation.monthlySubscription
            ? new Date()
            : reservation.subscriptionCancelledAt,
      scheduleProposalPendingBy: body.decision === 'CONFIRMED' ? null : reservation.scheduleProposalPendingBy,
      scheduleProposalAcceptedAt: body.decision === 'CONFIRMED' ? new Date() : reservation.scheduleProposalAcceptedAt
    },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  let calendarSynced = false
  let calendarRemoved = false
  let calendarReason: string | null = null

  if (body.decision === 'CONFIRMED') {
    if (updated.deliveryType === 'FARM' && updated.fulfillmentDate && updated.fulfillmentTime) {
      await markReservationProposalAccepted({
        reservationId: updated.id,
        proposalDate: updated.fulfillmentDate,
        proposalTime: updated.fulfillmentTime
      })
    }
    await ensureReservationOccurrences(updated, subscriptionsEnabled)
    if (subscriptionsEnabled) {
      await updateFutureOccurrencesFromReservation(updated)
    }
    try {
      const result = await syncReservationToGoogleCalendar(updated, subscriptionsEnabled)
      calendarSynced = result.synced
      calendarReason = result.reason
    } catch (e: any) {
      calendarReason = `Erreur sync: ${e.message}`
      console.error('Erreur sync Google Calendar:', e)
    }
  } else {
    await db.reservationOccurrence.updateMany({
      where: {
        reservationId: reservation.id,
        status: 'SCHEDULED'
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: body.decision === 'CANCELLED' ? 'Réservation annulée' : 'Réservation refusée'
      }
    })
  }

  if (body.decision !== 'CONFIRMED' && reservation.googleCalendarEventId) {
    const result = await removeReservationFromGoogleCalendar(reservation)
    calendarRemoved = result.removed
  }

  const emailPayload = await buildReservationDecisionEmail({
    reservation: updated,
    subject: body.email.subject,
    body: body.email.body,
    action: body.decision,
    subscriptionsEnabled,
    manageLinkMode: body.decision === 'CONFIRMED' ? 'cancel' : 'none'
  })

  await sendGmail({
    to: reservation.email,
    subject: body.email.subject,
    body: emailPayload.textBody,
    htmlBody: emailPayload.htmlBody,
    calendarInvite: emailPayload.calendarInvite,
    attachments: emailPayload.attachments
  })

  await logReservationNotification({
    reservationId: updated.id,
    kind: body.decision === 'CONFIRMED'
      ? reservation.status === 'CONFIRMED' ? 'UPDATED' : 'CONFIRMED'
      : body.decision,
    recipientEmail: reservation.email,
    subject: body.email.subject,
    summary: body.email.body
  })

  return { ok: true, status: updated.status, calendarSynced, calendarRemoved, calendarReason }
})
