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

export function getAdminReservationUrl(reservationId: number) {
  return `${getSiteOrigin()}/admin/reservations?open=${reservationId}`
}

export function buildAdminReservationSummary(options: {
  reservationId: number
  basketName: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerMessage?: string | null
  deliveryLabel: string
  fulfillmentDate?: Date | null
  fulfillmentTime?: string | null
  fulfillmentLocation?: string | null
  contextLine?: string
}) {
  return `${options.contextLine ? `${options.contextLine}\n\n` : ''}- Reservation : #${options.reservationId}
- Panier : ${options.basketName}
- Client : ${options.customerName}
- Email : ${options.customerEmail}
- Telephone : ${options.customerPhone ?? '-'}
- Mode : ${options.deliveryLabel}
- Date : ${options.fulfillmentDate ? options.fulfillmentDate.toLocaleDateString('fr-FR') : 'a confirmer'}
- Heure : ${options.fulfillmentTime ?? 'a confirmer'}
- Lieu : ${options.fulfillmentLocation ?? 'a confirmer'}
- Message : ${options.customerMessage ?? '-'}

Ouvrir la gestion admin :
${getAdminReservationUrl(options.reservationId)}`
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
  subscriptionsEnabled: boolean
}) {
  const organizerEmail = await getSetting(SETTING_KEYS.GMAIL_CONNECTED_EMAIL)
  const manageUrl = getManageReservationUrl(options.reservation.publicActionToken)
  const actionHelp = options.action === 'CONFIRMED' && manageUrl
    ? `${options.body}

${options.subscriptionsEnabled && options.reservation.monthlySubscription ? 'Arrêter mon abonnement :' : 'Annuler ma réservation :'}
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
      singleOccurrence: false,
      subscriptionsEnabled: options.subscriptionsEnabled
    })
    if (ics) {
      calendarInvite = ics
    } else {
      console.warn('[reservation-email] ICS non généré: date de reservation manquante', {
        reservationId: options.reservation.id,
        action: options.action,
        fulfillmentDate: options.reservation.fulfillmentDate
      })
    }
  } else if (options.action === 'CONFIRMED' || options.action === 'CANCELLED') {
    console.warn('[reservation-email] ICS non généré: email Gmail connecte introuvable', {
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
    originalOccurrenceDate?: Date | null
    occurrenceTime: string | null
    occurrenceLocation: string | null
    updatedAt?: Date
  }
  subject: string
  body: string
  action: 'CONFIRMED' | 'CANCELLED'
  recurrenceId?: Date | null
  subscriptionsEnabled?: boolean
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
      recurrenceId: options.recurrenceId ?? options.occurrence.originalOccurrenceDate ?? options.occurrence.occurrenceDate,
      recurrenceIdTime: options.reservation.fulfillmentTime,
      occurrenceDate: options.occurrence.occurrenceDate,
      occurrenceTime: options.occurrence.occurrenceTime,
      occurrenceLocation: options.occurrence.occurrenceLocation,
      singleOccurrence: true,
      updatedAt: options.occurrence.updatedAt,
      subscriptionsEnabled: options.subscriptionsEnabled ?? false
    })
    if (ics) {
      calendarInvite = ics
    } else {
      console.warn('[reservation-email] ICS occurrence non généré: date manquante', {
        reservationId: options.reservation.id,
        occurrenceId: options.occurrence.id,
        action: options.action
      })
    }
  } else {
    console.warn('[reservation-email] ICS occurrence non généré: email Gmail connecte introuvable', {
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
