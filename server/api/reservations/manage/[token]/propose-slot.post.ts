import { prisma } from '../../../../../prisma/client'
import { sendGmail } from '~/server/utils/gmail'
import { buildAdminReservationSummary, buildGenericEmail } from '~/server/utils/reservationEmails'
import { getSetting, SETTING_KEYS } from '~/server/utils/settings'
import { logReservationNotification } from '~/server/utils/reservationNotifications'
import { createReservationScheduleProposal, normalizeProposalDate, normalizeProposalTime } from '~/server/utils/reservationScheduleProposals'

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
    throw createError({ statusCode: 400, statusMessage: 'Date et heure requises pour proposer un autre creneau' })
  }

  const reservation = await prisma.reservation.findUnique({
    where: { publicActionToken: token },
    include: {
      basket: true
    }
  })

  if (!reservation) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  }
  if (reservation.deliveryType !== 'FARM') {
    throw createError({ statusCode: 400, statusMessage: 'Cette action est reservee au retrait a la ferme' })
  }

  const proposalDate = normalizeProposalDate(body.proposalDate)
  await createReservationScheduleProposal({
    reservationId: reservation.id,
    proposedBy: 'CUSTOMER',
    proposalDate,
    proposalTime,
    proposalLocation: reservation.fulfillmentLocation
  })

  const updated = await prisma.reservation.update({
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

  const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
  if (adminEmail) {
    const subject = `Nouvelle proposition client - ${reservation.basket.name}`
    const message = buildAdminReservationSummary({
      reservationId: reservation.id,
      basketName: reservation.basket.name,
      customerName: reservation.customerName,
      customerEmail: reservation.email,
      customerPhone: reservation.phone,
      customerMessage: reservation.message,
      deliveryLabel: 'Retrait a la ferme',
      fulfillmentDate: proposalDate,
      fulfillmentTime: proposalTime,
      fulfillmentLocation: reservation.fulfillmentLocation,
      contextLine: `${reservation.customerName} a propose un autre creneau pour son retrait a la ferme.`
    })

    await sendGmail({
      to: adminEmail,
      subject,
      body: message,
      htmlBody: buildGenericEmail({
        title: subject,
        body: message,
        accent: '#4f8a34'
      })
    })

    await logReservationNotification({
      reservationId: reservation.id,
      kind: 'CUSTOMER_PROPOSED_NEW_SLOT',
      recipientEmail: adminEmail,
      subject,
      summary: message
    })
  }

  return { ok: true, status: updated.status }
})
