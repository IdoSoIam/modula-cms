import type { Basket, DeliveryTour, PickupPoint, Reservation } from '@prisma/client'
import { buildReservationIcs } from './calendarInvite'
import { buildEmailHtml } from './emailTemplates'
import {
  getReservationActionLinkLabel,
  getReservationEmailHtmlLang,
  normalizeReservationLocale
} from './reservationEmailContent'
import { getSiteOrigin, getPreferredSenderEmail, type GmailCalendarInvite } from './gmail'

type ReservationWithRelations = Reservation & {
  basket: Basket
  pickupPoint: PickupPoint | null
  deliveryTour: DeliveryTour | null
}

type CustomerManageLinkMode = 'cancel' | 'manage' | 'respond' | 'none'

function getLogoUrl() {
  return `${getSiteOrigin()}/images/logo-removebg-preview.png`
}

export function getManageReservationUrl(token: string | null | undefined, locale?: string | null) {
  if (!token) return null
  const localePrefix = normalizeReservationLocale(locale) === 'en' ? '/en' : ''
  return `${getSiteOrigin()}${localePrefix}/reservation/manage/${token}`
}

export function getAdminReservationUrl(reservationId: number) {
  return `${getSiteOrigin()}/admin/reservations?open=${reservationId}`
}

export function appendReservationManageLink(options: {
  body: string
  reservation: Pick<Reservation, 'publicActionToken' | 'language' | 'monthlySubscription'>
  mode: CustomerManageLinkMode
  subscriptionsEnabled: boolean
}) {
  if (options.mode === 'none') return options.body

  const manageUrl = getManageReservationUrl(options.reservation.publicActionToken, options.reservation.language)
  if (!manageUrl) return options.body

  const monthlySubscription = options.subscriptionsEnabled && options.reservation.monthlySubscription
  const label = getReservationActionLinkLabel({
    action: options.mode === 'respond' ? 'PROPOSED' : options.mode === 'cancel' ? 'CONFIRMED' : 'CANCELLED',
    monthlySubscription,
    locale: options.reservation.language
  })

  return `${options.body}\n\n${label}\n${manageUrl}`
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
  lang?: string
}) {
  return buildEmailHtml({
    title: options.title,
    body: options.body,
    accent: options.accent,
    logoUrl: getLogoUrl(),
    lang: options.lang
  })
}

export async function buildReservationDecisionEmail(options: {
  reservation: ReservationWithRelations
  subject: string
  body: string
  action: 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  subscriptionsEnabled: boolean
  manageLinkMode?: CustomerManageLinkMode
}) {
  const organizerEmail = await getPreferredSenderEmail()
  const textBody = appendReservationManageLink({
    body: options.body,
    reservation: options.reservation,
    mode: options.manageLinkMode ?? (options.action === 'CONFIRMED' ? 'cancel' : 'none'),
    subscriptionsEnabled: options.subscriptionsEnabled
  })
  const htmlBody = buildEmailHtml({
    title: options.subject,
    body: textBody,
    accent: options.action === 'CONFIRMED' ? '#4f8a34' : options.action === 'CANCELLED' ? '#d97706' : '#b91c1c',
    logoUrl: getLogoUrl(),
    lang: getReservationEmailHtmlLang(options.reservation.language)
  })

  let calendarInvite: GmailCalendarInvite | undefined
  const manageUrl = getManageReservationUrl(options.reservation.publicActionToken, options.reservation.language)

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
      console.warn('[reservation-email] ICS non genere: date de reservation manquante', {
        reservationId: options.reservation.id,
        action: options.action,
        fulfillmentDate: options.reservation.fulfillmentDate
      })
    }
  } else if (options.action === 'CONFIRMED' || options.action === 'CANCELLED') {
      console.warn('[reservation-email] ICS non genere: email expediteur introuvable', {
        reservationId: options.reservation.id,
        action: options.action
      })
  }

  return {
    htmlBody,
    textBody,
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
  manageLinkMode?: CustomerManageLinkMode
}) {
  const organizerEmail = await getPreferredSenderEmail()
  const textBody = appendReservationManageLink({
    body: options.body,
    reservation: options.reservation,
    mode: options.manageLinkMode ?? 'manage',
    subscriptionsEnabled: options.subscriptionsEnabled ?? false
  })
  const htmlBody = buildEmailHtml({
    title: options.subject,
    body: textBody,
    accent: options.action === 'CONFIRMED' ? '#2563eb' : '#d97706',
    logoUrl: getLogoUrl(),
    lang: getReservationEmailHtmlLang(options.reservation.language)
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
      console.warn('[reservation-email] ICS occurrence non genere: date manquante', {
        reservationId: options.reservation.id,
        occurrenceId: options.occurrence.id,
        action: options.action
      })
    }
  } else {
    console.warn('[reservation-email] ICS occurrence non genere: email expediteur introuvable', {
      reservationId: options.reservation.id,
      occurrenceId: options.occurrence.id,
      action: options.action
    })
  }

  return {
    textBody,
    htmlBody,
    calendarInvite,
    attachments: []
  }
}
