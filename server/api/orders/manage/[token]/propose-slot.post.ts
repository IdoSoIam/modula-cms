import { db } from '#modula/server/data/client'
import { formatDateLabel } from '#modula/server/utils/dateFormat'
import { sendGmail } from '#modula/server/utils/gmail'
import { buildGenericEmail, getAdminReservationUrl } from '#modula/server/utils/orderEmails'
import { applyTemplateVars, getReservationEmailHtmlLang, resolveTemplateFromSettings } from '#modula/server/utils/orderEmailContent'
import { getReservationNotificationEmail } from '#modula/server/utils/settings'
import { logReservationNotification } from '#modula/server/utils/orderNotifications'
import { createReservationScheduleProposal, normalizeProposalDate, normalizeProposalTime } from '#modula/server/utils/orderScheduleProposals'

interface Body {
  proposalDate?: string
  proposalTime?: string
}

export default defineEventHandler(async (event) => {
  const token = String(getRouterParam(event, 'token') ?? '')
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Lien invalide' })
  }

  const body = await readBody<Body>(event)
  const proposalTime = normalizeProposalTime(body.proposalTime)
  if (!body.proposalDate || !proposalTime) {
    throw createError({ statusCode: 400, statusMessage: 'Date et heure requises pour proposer un autre créneau' })
  }

  const reservation = await db.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: true
    }
  })

  if (!reservation) {
    throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })
  }
  if (reservation.deliveryType !== 'FARM') {
    throw createError({ statusCode: 400, statusMessage: 'Cette action est réservée au Retrait sur place' })
  }

  const proposalDate = normalizeProposalDate(body.proposalDate)
  await createReservationScheduleProposal({
    reservationId: reservation.id,
    proposedBy: 'CUSTOMER',
    proposalDate,
    proposalTime,
    proposalLocation: reservation.fulfillmentLocation
  })

  const updated = await db.reservation.update({
    where: { id: reservation.id },
    data: {
      status: 'PENDING',
      fulfillmentDate: proposalDate,
      fulfillmentTime: proposalTime,
      scheduleProposalPendingBy: 'ADMIN',
      lastScheduleProposalAt: new Date(),
      scheduleProposalAcceptedAt: null
    }
  })

  const reservationNotificationEmail = await getReservationNotificationEmail()
  if (reservationNotificationEmail) {
    const adminTemplate = await resolveTemplateFromSettings('admin_customer_proposed_slot', 'fr')
    const adminDraft = applyTemplateVars(adminTemplate, {
      contextLine: `${reservation.customerName} a proposé un autre créneau pour son Retrait sur place.`,
      reservationId: String(reservation.id),
      basketName: reservation.basket.name,
      customerName: reservation.customerName,
      customerEmail: reservation.email,
      customerPhone: reservation.phone ?? '-',
      customerMessage: reservation.message ?? '-',
      deliveryMethod: 'Retrait sur place',
      fulfillmentDate: formatDateLabel(proposalDate, 'fr-FR'),
      fulfillmentTime: proposalTime,
      fulfillmentLocation: reservation.fulfillmentLocation ?? 'à confirmer',
      adminReservationUrl: getAdminReservationUrl(reservation.id)
    })

    await sendGmail({
      to: reservationNotificationEmail,
      subject: adminDraft.subject,
      body: adminDraft.body,
      htmlBody: await buildGenericEmail({
        title: adminDraft.subject,
        body: adminDraft.body,
        accent: '#4f8a34',
        lang: getReservationEmailHtmlLang('fr')
      })
    })

    await logReservationNotification({
      reservationId: reservation.id,
      kind: 'CUSTOMER_PROPOSED_NEW_SLOT',
      recipientEmail: reservationNotificationEmail,
      subject: adminDraft.subject,
      summary: adminDraft.body
    })
  }

  return { ok: true, status: updated.status }
})
