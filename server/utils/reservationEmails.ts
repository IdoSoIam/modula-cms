import type { Basket, DeliveryTour, PickupPoint, Reservation } from '@prisma/client'
import { buildReservationIcs } from './calendarInvite'
import { buildEmailHtml } from './emailTemplates'
import { getSetting, SETTING_KEYS } from './settings'
import { getSiteOrigin, type GmailCalendarInvite } from './gmail'

type ReservationWithRelations = Reservation & {
  basket: Basket
  pickupPoint: PickupPoint | null
  deliveryTour: DeliveryTour | null
}

function getLogoUrl() {
  return `${getSiteOrigin()}/images/logo-removebg-preview.png`
}

function getManageReservationUrl(token: string | null | undefined) {
  if (!token) return null
  return `${getSiteOrigin()}/reservation/manage/${token}`
}

export function buildGenericEmail(options: {
  title: string
  body: string
  accent?: string
}) {
  return buildEmailHtml({
    title: options.title,
    body: options.body,
    accent: options.accent,
    logoUrl: getLogoUrl()
  })
}

export async function buildReservationDecisionEmail(options: {
  reservation: ReservationWithRelations
  subject: string
  body: string
  action: 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
}) {
  const organizerEmail = await getSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL)
  const manageUrl = getManageReservationUrl(options.reservation.publicActionToken)
  const actionHelp = options.action === 'CONFIRMED' && manageUrl
    ? `${options.body}

${options.reservation.monthlySubscription ? 'Arreter mon abonnement :' : 'Annuler ma reservation :'}
${manageUrl}`
    : options.body
  const htmlBody = buildEmailHtml({
    title: options.subject,
    body: actionHelp,
    accent: options.action === 'CONFIRMED' ? '#4f8a34' : options.action === 'CANCELLED' ? '#d97706' : '#b91c1c',
    logoUrl: getLogoUrl()
  })

  let calendarInvite: GmailCalendarInvite | undefined
  if (organizerEmail && (options.action === 'CONFIRMED' || options.action === 'CANCELLED')) {
    const ics = buildReservationIcs({
      reservation: options.reservation,
      method: options.action === 'CONFIRMED' ? 'REQUEST' : 'CANCEL',
      organizerEmail,
      organizerName: 'Ferme du Campeyrigoux',
      manageUrl,
      singleOccurrence: false
    })
    if (ics) {
      calendarInvite = ics
    } else {
      console.warn('[reservation-email] ICS non genere: date de reservation manquante', {
        reservationId: options.reservation.id,
        action: options.action,
        fulfillmentDate: options.reservation.fulfillmentDate
      })
    }
  } else if (options.action === 'CONFIRMED' || options.action === 'CANCELLED') {
    console.warn('[reservation-email] ICS non genere: email Gmail connecte introuvable', {
      reservationId: options.reservation.id,
      action: options.action
    })
  }

  return {
    htmlBody,
    textBody: actionHelp,
    calendarInvite,
    attachments: []
  }
}

export async function buildReservationOccurrenceEmail(options: {
  reservation: ReservationWithRelations
  occurrence: {
    id: number
    occurrenceDate: Date
    occurrenceTime: string | null
    occurrenceLocation: string | null
    updatedAt?: Date
  }
  subject: string
  body: string
  action: 'CONFIRMED' | 'CANCELLED'
  recurrenceId?: Date | null
}) {
  const organizerEmail = await getSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL)
  const htmlBody = buildEmailHtml({
    title: options.subject,
    body: options.body,
    accent: options.action === 'CONFIRMED' ? '#2563eb' : '#d97706',
    logoUrl: getLogoUrl()
  })

  let calendarInvite: GmailCalendarInvite | undefined

  if (organizerEmail) {
    const ics = buildReservationIcs({
      reservation: options.reservation,
      method: options.action === 'CONFIRMED' ? 'REQUEST' : 'CANCEL',
      organizerEmail,
      organizerName: 'Ferme du Campeyrigoux',
      recurrenceId: options.recurrenceId ?? options.occurrence.occurrenceDate,
      occurrenceDate: options.occurrence.occurrenceDate,
      occurrenceTime: options.occurrence.occurrenceTime,
      occurrenceLocation: options.occurrence.occurrenceLocation,
      singleOccurrence: true,
      updatedAt: options.occurrence.updatedAt
    })
    if (ics) {
      calendarInvite = ics
    } else {
      console.warn('[reservation-email] ICS occurrence non genere: date manquante', {
        reservationId: options.reservation.id,
        occurrenceId: options.occurrence.id,
        action: options.action
      })
    }
  } else {
    console.warn('[reservation-email] ICS occurrence non genere: email Gmail connecte introuvable', {
      reservationId: options.reservation.id,
      occurrenceId: options.occurrence.id,
      action: options.action
    })
  }

  return {
    textBody: options.body,
    htmlBody,
    calendarInvite,
    attachments: []
  }
}
