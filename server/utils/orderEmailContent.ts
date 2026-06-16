import type { Reservation } from '#modula/server/data/types'
import { formatDateLabel } from './dateFormat'
import { formatFulfillmentDate } from './orderFulfillment'
import { SETTING_KEYS } from './settings'

export type ReservationLocale = 'fr' | 'en'

export interface EmailTemplate {
  subject: string
  body: string
}

export type TemplateAction =
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'proposed'
  | 'created'
  | 'accepted_proposal'
  | 'cancelled_by_customer'
  | 'stopped_subscription'
  | 'cancelled_occurrence'
  | 'updated_occurrence'
  | 'contact'
  | 'admin_new_reservation'
  | 'admin_customer_proposed_slot'
  | 'admin_customer_accepted_proposal'
  | 'admin_customer_cancelled'
  | 'admin_customer_stopped_subscription'
  | 'admin_customer_cancelled_occurrence'

export interface TemplateDefinition {
  action: TemplateAction
  settingKey: string
  label: string
  description: string
  variables: string[]
}

const DEFAULT_TEMPLATE_MAP: Record<ReservationLocale, Record<TemplateAction, EmailTemplate>> = {
  fr: {
    confirmed: {
      subject: 'Votre réservation de panier est confirmée - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Votre réservation pour le panier "{{basketName}}" est confirmée !

Détails de retrait :
- Mode : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Fenêtre de passage : {{deliveryWindow}}
- Lieu : {{fulfillmentLocation}}
- Montant : {{basketPrice}}

Le paiement se fait en espèces au retrait ou à la remise du panier.

Si vous avez la moindre question, vous pouvez répondre à cet email.

À bientôt,
La Ferme du Campeyrigoux`
    },
    rejected: {
      subject: 'Concernant votre réservation de panier - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Nous sommes désolés, votre réservation pour le panier "{{basketName}}" n'a pas pu être confirmée.

Raison : {{adminNote}}

N'hésitez pas à nous recontacter pour une prochaine réservation.

La Ferme du Campeyrigoux`
    },
    cancelled: {
      subject: 'Votre réservation a été annulée - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Votre réservation pour le panier "{{basketName}}" a été annulée.

Raison : {{adminNote}}

Si besoin, vous pouvez nous contacter directement pour en discuter.

La Ferme du Campeyrigoux`
    },
    proposed: {
      subject: 'Proposition de créneau pour votre retrait à la ferme - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Nous vous proposons le créneau suivant pour votre panier "{{basketName}}" :

- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}

Merci de confirmer ce créneau ou de proposer une autre date et heure depuis le lien présent dans notre email.

La Ferme du Campeyrigoux`
    },
    created: {
      subject: 'Nous avons bien reçu votre demande - {{basketName}}',
      body: `Bonjour {{customerName}},

Nous avons bien reçu votre demande de réservation pour le panier "{{basketName}}".

Récapitulatif :

- Mode : {{deliveryMethod}}
- Lieu / adresse : {{fulfillmentLocation}}
- Date indicative : {{fulfillmentDate}}
- Heure indicative : {{fulfillmentTime}}
- Montant du panier : {{basketPrice}}

Important :

- Votre demande doit encore être confirmée par la ferme
- Le paiement se fait en espèces au retrait ou à la remise
- Aucun paiement en ligne n'est demandé
- Pour un retrait à la ferme, ce créneau reste une proposition tant que la ferme ne l'a pas validé

Nous vous recontacterons par email avec la confirmation finale.`
    },
    accepted_proposal: {
      subject: 'Votre retrait à la ferme est confirmé - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Votre réservation est maintenant confirmée pour le créneau suivant :

- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}

Le paiement se fait en espèces au retrait.`
    },
    cancelled_by_customer: {
      subject: 'Votre réservation a été annulée - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Votre réservation a bien été annulée.

Si besoin, vous pouvez nous recontacter pour refaire une demande ultérieurement.`
    },
    stopped_subscription: {
      subject: 'Votre abonnement a été arrêté - Ferme du Campeyrigoux',
      body: `Bonjour {{customerName}},

Votre abonnement a bien été arrêté.

Si besoin, vous pouvez nous recontacter pour remettre en place une livraison plus tard.`
    },
    cancelled_occurrence: {
      subject: 'Annulation de cette semaine - {{basketName}}',
      body: `Bonjour {{customerName}},

Cette occurrence de votre réservation a été annulée pour cette semaine uniquement.`
    },
    updated_occurrence: {
      subject: 'Mise à jour de votre réservation - {{basketName}}',
      body: `Bonjour {{customerName}},

Votre réservation du panier "{{basketName}}" prévue le {{previousDate}} à {{previousTime}} a été modifiée.

Nouveaux détails :
- Date : {{nextDate}}
- Heure : {{nextTime}}
- Lieu : {{nextLocation}}

Anciens détails :
- Date : {{previousDate}}
- Heure : {{previousTime}}
- Lieu : {{previousLocation}}`
    },
    contact: {
      subject: 'Nouveau message de contact - {{contactName}}',
      body: `Nouveau message depuis le formulaire de contact :

- Nom : {{contactName}}
- Email : {{contactEmail}}

Message :
{{contactMessage}}`
    },
    admin_new_reservation: {
      subject: 'Nouvelle réservation - {{basketName}}',
      body: `{{contextLine}}

- Réservation : #{{reservationId}}
- Panier : {{basketName}}
- Client : {{customerName}}
- Email : {{customerEmail}}
- Telephone : {{customerPhone}}
- Mode : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}
- Message : {{customerMessage}}

Ouvrir la gestion admin :
{{adminReservationUrl}}`
    },
    admin_customer_proposed_slot: {
      subject: 'Nouvelle proposition client - {{basketName}}',
      body: `{{contextLine}}

- Réservation : #{{reservationId}}
- Panier : {{basketName}}
- Client : {{customerName}}
- Email : {{customerEmail}}
- Telephone : {{customerPhone}}
- Mode : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}
- Message : {{customerMessage}}

Ouvrir la gestion admin :
{{adminReservationUrl}}`
    },
    admin_customer_accepted_proposal: {
      subject: 'Proposition acceptée par le client - {{basketName}}',
      body: `{{contextLine}}

- Réservation : #{{reservationId}}
- Panier : {{basketName}}
- Client : {{customerName}}
- Email : {{customerEmail}}
- Telephone : {{customerPhone}}
- Mode : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}
- Message : {{customerMessage}}

Ouvrir la gestion admin :
{{adminReservationUrl}}`
    },
    admin_customer_cancelled: {
      subject: 'Réservation annulée par le client - {{basketName}}',
      body: `{{contextLine}}

- Panier : {{basketName}}
- Client : {{customerName}}
- Email : {{customerEmail}}`
    },
    admin_customer_stopped_subscription: {
      subject: 'Abonnement arrêté par le client - {{basketName}}',
      body: `{{contextLine}}

- Panier : {{basketName}}
- Client : {{customerName}}
- Email : {{customerEmail}}`
    },
    admin_customer_cancelled_occurrence: {
      subject: 'Occurrence annulée par le client - {{basketName}}',
      body: `{{contextLine}}

- Panier : {{basketName}}
- Client : {{customerName}}
- Email : {{customerEmail}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}`
    }
  },
  en: {
    confirmed: {
      subject: 'Your basket reservation is confirmed - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

Your reservation for the "{{basketName}}" basket is confirmed.

Pickup details:
- Method: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Delivery window: {{deliveryWindow}}
- Location: {{fulfillmentLocation}}
- Amount: {{basketPrice}}

Payment is made in cash when you collect or receive your basket.

If you have any questions, you can reply to this email.

See you soon,
Ferme du Campeyrigoux`
    },
    rejected: {
      subject: 'About your basket reservation - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

We are sorry, but your reservation for the "{{basketName}}" basket could not be confirmed.

Reason: {{adminNote}}

Please feel free to contact us again for a future reservation.

Ferme du Campeyrigoux`
    },
    cancelled: {
      subject: 'Your reservation has been cancelled - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

Your reservation for the "{{basketName}}" basket has been cancelled.

Reason: {{adminNote}}

If needed, you can contact us directly to discuss it.

Ferme du Campeyrigoux`
    },
    proposed: {
      subject: 'Pickup slot proposal for your farm collection - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

We would like to offer you the following pickup slot for your "{{basketName}}" basket:

- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}

Please confirm this slot or suggest another date and time using the link in our email.

Ferme du Campeyrigoux`
    },
    created: {
      subject: 'We have received your request - {{basketName}}',
      body: `Hello {{customerName}},

We have received your reservation request for the "{{basketName}}" basket.

Summary:

- Method: {{deliveryMethod}}
- Location / address: {{fulfillmentLocation}}
- Estimated date: {{fulfillmentDate}}
- Estimated time: {{fulfillmentTime}}
- Basket amount: {{basketPrice}}

Important:

- Your request still needs to be confirmed by the farm
- Payment is made in cash when you collect or receive the basket
- No online payment is required
- For farm pickup, this slot remains a proposal until the farm confirms it

We will contact you again by email with the final confirmation.`
    },
    accepted_proposal: {
      subject: 'Your farm pickup is confirmed - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

Your reservation is now confirmed for the following slot:

- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}

Payment is made in cash when you collect your basket.`
    },
    cancelled_by_customer: {
      subject: 'Your reservation has been cancelled - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

Your reservation has been cancelled successfully.

If needed, you can contact us again to place a new request later.`
    },
    stopped_subscription: {
      subject: 'Your subscription has been stopped - Ferme du Campeyrigoux',
      body: `Hello {{customerName}},

Your subscription has been stopped successfully.

If needed, you can contact us again to start deliveries later on.`
    },
    cancelled_occurrence: {
      subject: "This week's occurrence has been cancelled - {{basketName}}",
      body: `Hello {{customerName}},

This week's occurrence of your reservation has been cancelled.`
    },
    updated_occurrence: {
      subject: 'Update to your reservation - {{basketName}}',
      body: `Hello {{customerName}},

Your "{{basketName}}" reservation scheduled for {{previousDate}} at {{previousTime}} has been updated.

New details:
- Date: {{nextDate}}
- Time: {{nextTime}}
- Location: {{nextLocation}}

Previous details:
- Date: {{previousDate}}
- Time: {{previousTime}}
- Location: {{previousLocation}}`
    },
    contact: {
      subject: 'New contact message - {{contactName}}',
      body: `New message from the contact form:

- Name: {{contactName}}
- Email: {{contactEmail}}

Message:
{{contactMessage}}`
    },
    admin_new_reservation: {
      subject: 'New reservation - {{basketName}}',
      body: `{{contextLine}}

- Reservation: #{{reservationId}}
- Basket: {{basketName}}
- Customer: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Method: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}
- Message: {{customerMessage}}

Open admin:
{{adminReservationUrl}}`
    },
    admin_customer_proposed_slot: {
      subject: 'New customer slot proposal - {{basketName}}',
      body: `{{contextLine}}

- Reservation: #{{reservationId}}
- Basket: {{basketName}}
- Customer: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Method: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}
- Message: {{customerMessage}}

Open admin:
{{adminReservationUrl}}`
    },
    admin_customer_accepted_proposal: {
      subject: 'Slot proposal accepted by the customer - {{basketName}}',
      body: `{{contextLine}}

- Reservation: #{{reservationId}}
- Basket: {{basketName}}
- Customer: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Method: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}
- Message: {{customerMessage}}

Open admin:
{{adminReservationUrl}}`
    },
    admin_customer_cancelled: {
      subject: 'Reservation cancelled by the customer - {{basketName}}',
      body: `{{contextLine}}

- Basket: {{basketName}}
- Customer: {{customerName}}
- Email: {{customerEmail}}`
    },
    admin_customer_stopped_subscription: {
      subject: 'Subscription stopped by the customer - {{basketName}}',
      body: `{{contextLine}}

- Basket: {{basketName}}
- Customer: {{customerName}}
- Email: {{customerEmail}}`
    },
    admin_customer_cancelled_occurrence: {
      subject: 'Occurrence cancelled by the customer - {{basketName}}',
      body: `{{contextLine}}

- Basket: {{basketName}}
- Customer: {{customerName}}
- Email: {{customerEmail}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}`
    }
  }
}

export function normalizeReservationLocale(value: string | null | undefined): ReservationLocale {
  return value === 'en' ? 'en' : 'fr'
}

export function getReservationDateLocale(locale: string | null | undefined) {
  return normalizeReservationLocale(locale) === 'en' ? 'en-US' : 'fr-FR'
}

export function getReservationEmailHtmlLang(locale: string | null | undefined) {
  return normalizeReservationLocale(locale) === 'en' ? 'en' : 'fr'
}

export function getReservationLanguageLabel(locale: string | null | undefined) {
  return normalizeReservationLocale(locale) === 'en' ? 'English' : 'Français'
}

function parseTemplateObject(value: unknown): EmailTemplate | null {
  if (!value || typeof value !== 'object') return null
  const subject = typeof (value as any).subject === 'string' ? (value as any).subject : null
  const body = typeof (value as any).body === 'string' ? (value as any).body : null
  return subject && body ? { subject, body } : null
}

export function getDefaultReservationTemplate(action: TemplateAction, locale: string | null | undefined) {
  return DEFAULT_TEMPLATE_MAP[normalizeReservationLocale(locale)][action]
}

export const TEMPLATE_ACTION_SETTING_KEYS: Record<TemplateAction, string> = {
  confirmed: SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
  rejected: SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
  cancelled: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED,
  proposed: SETTING_KEYS.RESERVATION_TEMPLATE_PROPOSED,
  created: SETTING_KEYS.RESERVATION_TEMPLATE_CREATED,
  accepted_proposal: SETTING_KEYS.RESERVATION_TEMPLATE_ACCEPTED_PROPOSAL,
  cancelled_by_customer: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED_BY_CUSTOMER,
  stopped_subscription: SETTING_KEYS.RESERVATION_TEMPLATE_STOPPED_SUBSCRIPTION,
  cancelled_occurrence: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED_OCCURRENCE,
  updated_occurrence: SETTING_KEYS.RESERVATION_TEMPLATE_UPDATED_OCCURRENCE,
  contact: SETTING_KEYS.RESERVATION_TEMPLATE_CONTACT,
  admin_new_reservation: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_NEW_RESERVATION,
  admin_customer_proposed_slot: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_PROPOSED_SLOT,
  admin_customer_accepted_proposal: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_ACCEPTED_PROPOSAL,
  admin_customer_cancelled: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED,
  admin_customer_stopped_subscription: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_STOPPED_SUBSCRIPTION,
  admin_customer_cancelled_occurrence: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED_OCCURRENCE
}

export function getTemplateSettingKey(action: TemplateAction): string {
  return TEMPLATE_ACTION_SETTING_KEYS[action]
}

export const ALL_TEMPLATE_SETTING_KEYS = Object.values(TEMPLATE_ACTION_SETTING_KEYS)

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    action: 'confirmed',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    label: 'Confirmation client',
    description: 'Email envoyé quand une réservation est confirmée.',
    variables: ['customerName', 'basketName', 'basketPrice', 'deliveryMethod', 'deliveryWindow', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminNote']
  },
  {
    action: 'rejected',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
    label: 'Refus client',
    description: 'Email envoyé quand une réservation est refusée.',
    variables: ['customerName', 'basketName', 'adminNote']
  },
  {
    action: 'cancelled',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED,
    label: 'Annulation client',
    description: 'Email envoyé quand une réservation est annulée par l’admin.',
    variables: ['customerName', 'basketName', 'adminNote']
  },
  {
    action: 'proposed',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_PROPOSED,
    label: 'Contre-proposition client',
    description: 'Email envoyé quand l’admin propose un autre créneau.',
    variables: ['customerName', 'basketName', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation']
  },
  {
    action: 'created',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CREATED,
    label: 'Accusé de réception client',
    description: 'Email envoyé juste après la création d’une réservation.',
    variables: ['customerName', 'basketName', 'basketPrice', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation']
  },
  {
    action: 'accepted_proposal',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ACCEPTED_PROPOSAL,
    label: 'Acceptation de proposition client',
    description: 'Email envoyé quand le client accepte un créneau proposé par la ferme.',
    variables: ['customerName', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation']
  },
  {
    action: 'cancelled_by_customer',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED_BY_CUSTOMER,
    label: 'Annulation par le client',
    description: 'Email de confirmation envoyé au client après son annulation.',
    variables: ['customerName']
  },
  {
    action: 'stopped_subscription',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_STOPPED_SUBSCRIPTION,
    label: 'Arrêt abonnement client',
    description: 'Email envoyé au client après arrêt de son abonnement.',
    variables: ['customerName']
  },
  {
    action: 'cancelled_occurrence',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED_OCCURRENCE,
    label: 'Annulation occurrence client',
    description: 'Email envoyé pour annuler une seule occurrence.',
    variables: ['customerName', 'basketName']
  },
  {
    action: 'updated_occurrence',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_UPDATED_OCCURRENCE,
    label: 'Mise à jour occurrence client',
    description: 'Email envoyé quand une occurrence est déplacée ou modifiée.',
    variables: ['customerName', 'basketName', 'previousDate', 'previousTime', 'previousLocation', 'nextDate', 'nextTime', 'nextLocation']
  },
  {
    action: 'contact',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CONTACT,
    label: 'Formulaire de contact',
    description: 'Email reçu par l’admin depuis le formulaire de contact.',
    variables: ['contactName', 'contactEmail', 'contactMessage']
  },
  {
    action: 'admin_new_reservation',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_NEW_RESERVATION,
    label: 'Nouvelle réservation admin',
    description: 'Notification admin à la création d’une réservation.',
    variables: ['contextLine', 'reservationId', 'basketName', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminReservationUrl']
  },
  {
    action: 'admin_customer_proposed_slot',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_PROPOSED_SLOT,
    label: 'Proposition client admin',
    description: 'Notification admin quand un client propose un autre créneau.',
    variables: ['contextLine', 'reservationId', 'basketName', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminReservationUrl']
  },
  {
    action: 'admin_customer_accepted_proposal',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_ACCEPTED_PROPOSAL,
    label: 'Proposition acceptée admin',
    description: 'Notification admin quand un client accepte un créneau.',
    variables: ['contextLine', 'reservationId', 'basketName', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminReservationUrl']
  },
  {
    action: 'admin_customer_cancelled',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED,
    label: 'Annulation client vers admin',
    description: 'Notification admin quand un client annule sa réservation.',
    variables: ['contextLine', 'basketName', 'customerName', 'customerEmail']
  },
  {
    action: 'admin_customer_stopped_subscription',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_STOPPED_SUBSCRIPTION,
    label: 'Arrêt abonnement vers admin',
    description: 'Notification admin quand un client arrête son abonnement.',
    variables: ['contextLine', 'basketName', 'customerName', 'customerEmail']
  },
  {
    action: 'admin_customer_cancelled_occurrence',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED_OCCURRENCE,
    label: 'Annulation occurrence vers admin',
    description: 'Notification admin quand un client annule une occurrence.',
    variables: ['contextLine', 'basketName', 'customerName', 'customerEmail', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation']
  }
]

export function applyTemplateVars(template: EmailTemplate, vars: Record<string, string>): EmailTemplate {
  const replace = (s: string) => Object.entries(vars).reduce((acc, [key, val]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), val), s)
  return { subject: replace(template.subject), body: replace(template.body) }
}

export async function resolveTemplateFromSettings(action: TemplateAction, locale: string | null | undefined): Promise<EmailTemplate> {
  const { getSetting } = await import('./settings')
  const raw = await getSetting(getTemplateSettingKey(action))
  return resolveReservationTemplate(raw, action, locale)
}

export function resolveReservationTemplate(
  raw: string | null | undefined,
  action: TemplateAction,
  locale: string | null | undefined
) {
  const normalized = normalizeReservationLocale(locale)
  const fallback = DEFAULT_TEMPLATE_MAP[normalized][action]

  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw)
    const localized = parseTemplateObject((parsed as Record<string, unknown>)?.[normalized])
    if (localized) return localized

    const legacy = parseTemplateObject(parsed)
    if (legacy) return normalized === 'fr' ? legacy : fallback
  } catch {
    return fallback
  }

  return fallback
}

export function getReservationActionLinkLabel(options: {
  action: 'CONFIRMED' | 'CANCELLED' | 'PROPOSED'
  monthlySubscription: boolean
  locale: string | null | undefined
}) {
  const normalized = normalizeReservationLocale(options.locale)

  if (normalized === 'en') {
    if (options.action === 'PROPOSED') {
      return 'Confirm this slot or suggest another one:'
    }
    if (options.action === 'CONFIRMED') {
      return options.monthlySubscription ? 'Stop my subscription:' : 'Cancel my reservation:'
    }
    return options.monthlySubscription ? 'Subscription management:' : 'Reservation management:'
  }

  if (options.action === 'PROPOSED') {
    return 'Confirmer ce créneau ou en proposer un autre :'
  }

  if (options.action === 'CONFIRMED') {
    return options.monthlySubscription ? 'Arrêter mon abonnement :' : 'Annuler ma réservation :'
  }

  return options.monthlySubscription ? 'Gérer mon abonnement :' : 'Gérer ma réservation :'
}

export function buildReservationCreatedCustomerEmail(options: {
  locale: string | null | undefined
  customerName: string
  basketName: string
  deliveryLabel: string
  fulfillmentLocation: string | null
  fulfillmentDate: Date | null
  fulfillmentTime: string | null
  basketPrice: number
  deliveryType: Reservation['deliveryType']
}) {
  const normalized = normalizeReservationLocale(options.locale)
  const localeCode = getReservationDateLocale(normalized)
  const dateLabel = options.fulfillmentDate ? formatDateLabel(options.fulfillmentDate, localeCode) : (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const timeLabel = options.fulfillmentTime ?? (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const locationLabel = options.fulfillmentLocation ?? '-'
  const priceLabel = new Intl.NumberFormat(localeCode, { style: 'currency', currency: 'EUR' }).format(options.basketPrice)

  if (normalized === 'en') {
    return {
      subject: `We have received your request - ${options.basketName}`,
      body: `Hello ${options.customerName},

We have received your reservation request for the "${options.basketName}" basket.

Summary:

- Method: ${options.deliveryLabel}
- Location / address: ${locationLabel}
- Estimated date: ${dateLabel}
- Estimated time: ${timeLabel}
- Basket amount: ${priceLabel}

Important:

- Your request still needs to be confirmed by the farm
- Payment is made in cash when you collect or receive the basket
- No online payment is required
- For farm pickup, this slot remains a proposal until the farm confirms it

We will contact you again by email with the final confirmation.`
    }
  }

  return {
    subject: `Nous avons bien reçu votre demande - ${options.basketName}`,
    body: `Bonjour ${options.customerName},

Nous avons bien reçu votre demande de réservation pour le panier "${options.basketName}".

Récapitulatif :

- Mode : ${options.deliveryLabel}
- Lieu / adresse : ${locationLabel}
- Date indicative : ${dateLabel}
- Heure indicative : ${timeLabel}
- Montant du panier : ${priceLabel}

Important :

- Votre demande doit encore être confirmée par la ferme
- Le paiement se fait en espèces au retrait ou à la remise
- Aucun paiement en ligne n'est demandé
- Pour un retrait à la ferme, ce créneau reste une proposition tant que la ferme ne l'a pas validé

Nous vous recontacterons par email avec la confirmation finale.`
  }
}

export function buildReservationAcceptedProposalCustomerEmail(options: {
  locale: string | null | undefined
  customerName: string
  fulfillmentDate: Date | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
}) {
  const normalized = normalizeReservationLocale(options.locale)
  const dateLabel = options.fulfillmentDate ? formatDateLabel(options.fulfillmentDate, getReservationDateLocale(normalized)) : (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const timeLabel = options.fulfillmentTime ?? (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const locationLabel = options.fulfillmentLocation ?? 'Ferme du Campeyrigoux'

  if (normalized === 'en') {
    return {
      subject: 'Your farm pickup is confirmed - Ferme du Campeyrigoux',
      body: `Hello ${options.customerName},

Your reservation is now confirmed for the following slot:

- Date: ${dateLabel}
- Time: ${timeLabel}
- Location: ${locationLabel}

Payment is made in cash when you collect your basket.`
    }
  }

  return {
    subject: 'Votre retrait à la ferme est confirmé - Ferme du Campeyrigoux',
    body: `Bonjour ${options.customerName},

Votre réservation est maintenant confirmée pour le créneau suivant :

- Date : ${dateLabel}
- Heure : ${timeLabel}
- Lieu : ${locationLabel}

Le paiement se fait en espèces au retrait.`
  }
}

export function buildReservationCancelledByCustomerEmail(options: {
  locale: string | null | undefined
  customerName: string
  monthlySubscription: boolean
}) {
  const normalized = normalizeReservationLocale(options.locale)

  if (normalized === 'en') {
    return options.monthlySubscription
      ? {
        subject: 'Your subscription has been stopped - Ferme du Campeyrigoux',
        body: `Hello ${options.customerName},

Your subscription has been stopped successfully.

If needed, you can contact us again to start deliveries later on.`
      }
      : {
        subject: 'Your reservation has been cancelled - Ferme du Campeyrigoux',
        body: `Hello ${options.customerName},

Your reservation has been cancelled successfully.

If needed, you can contact us again to place a new request later.`
      }
  }

  return options.monthlySubscription
    ? {
      subject: 'Votre abonnement a été arrêté - Ferme du Campeyrigoux',
      body: `Bonjour ${options.customerName},

Votre abonnement a bien été arrêté.

Si besoin, vous pouvez nous recontacter pour remettre en place une livraison plus tard.`
    }
    : {
      subject: 'Votre réservation a été annulée - Ferme du Campeyrigoux',
      body: `Bonjour ${options.customerName},

Votre réservation a bien été annulée.

Si besoin, vous pouvez nous recontacter pour refaire une demande ultérieurement.`
    }
}

export function buildReservationStoppedCustomerEmail(options: {
  locale: string | null | undefined
  customerName: string
}) {
  const normalized = normalizeReservationLocale(options.locale)

  if (normalized === 'en') {
    return {
      subject: 'Your subscription has been stopped - Ferme du Campeyrigoux',
      body: `Hello ${options.customerName},

Your subscription has been stopped successfully.

Thank you for your trust.`
    }
  }

  return {
    subject: 'Votre abonnement a été arrêté - Ferme du Campeyrigoux',
    body: `Bonjour ${options.customerName},

Votre abonnement a bien été arrêté.

Merci pour votre confiance.`
  }
}

export function buildReservationOccurrenceUpdatedEmail(options: {
  locale: string | null | undefined
  customerName: string
  basketName: string
  previousDate: Date
  previousTime: string | null
  previousLocation: string | null
  nextDate: Date | null
  nextTime: string | null
  nextLocation: string | null
}) {
  const normalized = normalizeReservationLocale(options.locale)
  const localeCode = getReservationDateLocale(normalized)
  const previousDateLabel = formatFulfillmentDate(options.previousDate, localeCode)
  const nextDateLabel = options.nextDate ? formatFulfillmentDate(options.nextDate, localeCode) : (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const previousTimeLabel = options.previousTime ?? (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const nextTimeLabel = options.nextTime ?? (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const previousLocationLabel = options.previousLocation ?? (normalized === 'en' ? 'to be confirmed' : 'à confirmer')
  const nextLocationLabel = options.nextLocation ?? (normalized === 'en' ? 'to be confirmed' : 'à confirmer')

  if (normalized === 'en') {
    return {
      subject: `Update to your reservation - ${options.basketName}`,
      body: `Hello ${options.customerName},

Your "${options.basketName}" reservation scheduled for ${previousDateLabel} at ${previousTimeLabel} has been updated.

New details:
- Date: ${nextDateLabel}
- Time: ${nextTimeLabel}
- Location: ${nextLocationLabel}

Previous details:
- Date: ${previousDateLabel}
- Time: ${previousTimeLabel}
- Location: ${previousLocationLabel}`
    }
  }

  return {
    subject: `Mise à jour de votre réservation - ${options.basketName}`,
    body: `Bonjour ${options.customerName},

Votre réservation du panier "${options.basketName}" prévue le ${previousDateLabel} à ${previousTimeLabel} a été modifiée.

Nouveaux détails :
- Date : ${nextDateLabel}
- Heure : ${nextTimeLabel}
- Lieu : ${nextLocationLabel}

Anciens détails :
- Date : ${previousDateLabel}
- Heure : ${previousTimeLabel}
- Lieu : ${previousLocationLabel}`
  }
}

export function buildReservationOccurrenceCancelledEmail(options: {
  locale: string | null | undefined
  customerName: string
  basketName: string
}) {
  const normalized = normalizeReservationLocale(options.locale)

  if (normalized === 'en') {
    return {
      subject: `This week's occurrence has been cancelled - ${options.basketName}`,
      body: `Hello ${options.customerName},

This week's occurrence of your reservation has been cancelled.`
    }
  }

  return {
    subject: `Annulation de cette semaine - ${options.basketName}`,
    body: `Bonjour ${options.customerName},

Cette occurrence de votre réservation a été annulée pour cette semaine uniquement.`
  }
}
