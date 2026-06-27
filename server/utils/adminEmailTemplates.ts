import { deleteSetting, getSetting, setSetting, SETTING_KEYS } from './settings'
import {
  TEMPLATE_DEFINITIONS as RESERVATION_TEMPLATE_DEFINITIONS,
  resolveReservationTemplate,
  type EmailTemplate,
  type TemplateAction
} from './orderEmailContent'

interface LocalizedText {
  fr: string
  en: string
}

export interface AdminEmailTemplateDefinition {
  action: string
  settingKey: string
  label: LocalizedText
  description: LocalizedText
  group: LocalizedText
  subgroup: LocalizedText
  variables: string[]
  locked: boolean
  system: boolean
}

interface StoredCustomTemplateDefinition {
  action: string
  label: LocalizedText
  description: LocalizedText
  group: LocalizedText
  subgroup: LocalizedText
  variables: string[]
}

const CUSTOM_TEMPLATE_PREFIX = 'custom_email_template_'

const localized = (fr: string, en: string): LocalizedText => ({ fr, en })
const GROUP_ORDERS = localized('Commandes', 'Orders')
const GROUP_EVENTS = localized('Événements', 'Events')
const GROUP_FORMS = localized('Formulaires', 'Forms')
const GROUP_USERS = localized('Utilisateurs', 'Users')
const SUBGROUP_ORDER_CUSTOMER = localized('Commande client', 'Customer order')
const SUBGROUP_ORDER_ADMIN = localized('Commande admin', 'Admin order')
const SUBGROUP_SUBSCRIPTION_CUSTOMER = localized('Abonnement client', 'Customer subscription')
const SUBGROUP_SUBSCRIPTION_ADMIN = localized('Abonnement admin', 'Admin subscription')
const SUBGROUP_EVENT_PARTICIPATION_CUSTOMER = localized('Participation client', 'Customer participation')
const SUBGROUP_EVENT_PARTICIPATION_ADMIN = localized('Participation admin', 'Admin participation')
const SUBGROUP_EVENT_PUBLIC_RESERVATION_CUSTOMER = localized('Réservation publique client', 'Customer public reservation')
const SUBGROUP_EVENT_PUBLIC_RESERVATION_ADMIN = localized('Réservation publique admin', 'Admin public reservation')
const SUBGROUP_FORM_CONTACT = localized('Contact', 'Contact')
const SUBGROUP_FORM_SIGNUPS = localized('Inscriptions', 'Signups')
const SUBGROUP_USER_ONBOARDING = localized('Invitation', 'Invitation')

const RESERVATION_ACTIONS = new Set(
  RESERVATION_TEMPLATE_DEFINITIONS.map(definition => definition.action)
)

const CUSTOM_TEMPLATE_DEFAULTS: Record<string, Record<'fr' | 'en', EmailTemplate>> = {
  event_call_for_participation: {
    fr: {
      subject: 'Appel à participation - {{eventTitle}}',
      body: `Bonjour {{recipientName}},

Nous lançons un appel à participation pour l’événement "{{eventTitle}}".

- Date : {{eventDate}}
- Heure : {{eventTime}}
- Lieu : {{eventLocation}}

{{eventDescription}}

Pour participer, utilisez ce lien :
{{eventParticipationUrl}}`
    },
    en: {
      subject: 'Call for participation - {{eventTitle}}',
      body: `Hello {{recipientName}},

We are inviting participants for the "{{eventTitle}}" event.

- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{eventLocation}}

{{eventDescription}}

To participate, use this link:
{{eventParticipationUrl}}`
    }
  },
  event_participation_confirmation: {
    fr: {
      subject: 'Participation confirmée - {{eventTitle}}',
      body: `Bonjour {{participantName}},

Votre participation à "{{eventTitle}}" est confirmée.

- Date : {{eventDate}}
- Heure : {{eventTime}}
- Lieu : {{eventLocation}}

À bientôt.`
    },
    en: {
      subject: 'Participation confirmed - {{eventTitle}}',
      body: `Hello {{participantName}},

Your participation in "{{eventTitle}}" is confirmed.

- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{eventLocation}}

See you soon.`
    }
  },
  admin_new_event_participation: {
    fr: {
      subject: 'Nouvelle participation - {{eventTitle}}',
      body: `Nouvelle participation enregistrée.

- Événement : {{eventTitle}}
- Participant : {{participantName}}
- Email : {{participantEmail}}
- Téléphone : {{participantPhone}}
- Message : {{participantMessage}}

Voir l’admin :
{{adminEventUrl}}`
    },
    en: {
      subject: 'New participation - {{eventTitle}}',
      body: `A new participation has been recorded.

- Event: {{eventTitle}}
- Participant: {{participantName}}
- Email: {{participantEmail}}
- Phone: {{participantPhone}}
- Message: {{participantMessage}}

Open admin:
{{adminEventUrl}}`
    }
  },
  admin_new_public_event_reservation: {
    fr: {
      subject: 'Nouvelle réservation publique - {{eventTitle}}',
      body: `Nouvelle réservation publique enregistrée.

- Événement : {{eventTitle}}
- Réservation : #{{reservationId}}
- Client : {{customerName}}
- Email : {{customerEmail}}
- Téléphone : {{customerPhone}}
- Nombre de places : {{reservationSeats}}
- Message : {{customerMessage}}

Voir l’admin :
{{adminEventUrl}}`
    },
    en: {
      subject: 'New public reservation - {{eventTitle}}',
      body: `A new public reservation has been recorded.

- Event: {{eventTitle}}
- Reservation: #{{reservationId}}
- Customer: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Seats: {{reservationSeats}}
- Message: {{customerMessage}}

Open admin:
{{adminEventUrl}}`
    }
  },
  public_event_reservation_confirmation: {
    fr: {
      subject: 'Votre réservation est confirmée - {{eventTitle}}',
      body: `Bonjour {{customerName}},

Votre réservation pour "{{eventTitle}}" est confirmée.

- Date : {{eventDate}}
- Heure : {{eventTime}}
- Lieu : {{eventLocation}}
- Nombre de places : {{reservationSeats}}

Merci.`
    },
    en: {
      subject: 'Your reservation is confirmed - {{eventTitle}}',
      body: `Hello {{customerName}},

Your reservation for "{{eventTitle}}" is confirmed.

- Date: {{eventDate}}
- Time: {{eventTime}}
- Location: {{eventLocation}}
- Seats: {{reservationSeats}}

Thank you.`
    }
  },
  signup_request: {
    fr: {
      subject: 'Nouvelle demande d’inscription - {{signupLabel}}',
      body: `Nouvelle demande d’inscription reçue.

- Formulaire : {{signupLabel}}
- Nom : {{applicantName}}
- Email : {{applicantEmail}}
- Téléphone : {{applicantPhone}}
- Message : {{applicantMessage}}

Voir l’admin :
{{adminSignupUrl}}`
    },
    en: {
      subject: 'New signup request - {{signupLabel}}',
      body: `A new signup request has been received.

- Form: {{signupLabel}}
- Name: {{applicantName}}
- Email: {{applicantEmail}}
- Phone: {{applicantPhone}}
- Message: {{applicantMessage}}

Open admin:
{{adminSignupUrl}}`
    }
  },
  signup_request_confirmation: {
    fr: {
      subject: 'Votre demande d’inscription a bien été reçue',
      body: `Bonjour {{applicantName}},

Nous avons bien reçu votre demande d’inscription "{{signupLabel}}".

Nous reviendrons vers vous dès que possible.`
    },
    en: {
      subject: 'Your signup request has been received',
      body: `Hello {{applicantName}},

We have received your "{{signupLabel}}" signup request.

We will get back to you as soon as possible.`
    }
  },
  user_invitation: {
    fr: {
      subject: 'Activez votre compte - Le site',
      body: `Bonjour {{recipientName}},

Un compte a été créé pour vous sur ce site.

Pour choisir votre mot de passe et activer votre compte, utilisez ce lien :
{{passwordSetupUrl}}

Ce lien expire le {{expiresAt}}.`
    },
    en: {
      subject: 'Activate your account - The website',
      body: `Hello {{recipientName}},

An account has been created for you on this website.

To choose your password and activate your account, use this link:
{{passwordSetupUrl}}

      This link expires on {{expiresAt}}.`
    }
  },
  shop_order_created: {
    fr: {
      subject: 'Commande reçue - {{orderNumber}}',
      body: `Bonjour {{customerName}},

Nous avons bien reçu votre commande {{orderNumber}}.

- Livraison : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}
- Paiement : {{paymentProvider}}
- Statut du paiement : {{paymentStatus}}
- Total : {{total}}

Lignes de commande :
{{orderLines}}

Si vous avez un message complémentaire, notre équipe reviendra vers vous si nécessaire.`
    },
    en: {
      subject: 'Order received - {{orderNumber}}',
      body: `Hello {{customerName}},

We have received your order {{orderNumber}}.

- Delivery: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}
- Payment: {{paymentProvider}}
- Payment status: {{paymentStatus}}
- Total: {{total}}

Order lines:
{{orderLines}}

If needed, our team will get back to you with any additional information.`
    }
  },
  shop_order_payment_confirmed: {
    fr: {
      subject: 'Paiement confirmé - {{orderNumber}}',
      body: `Bonjour {{customerName}},

Le paiement de votre commande {{orderNumber}} est confirmé.

- Livraison : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}
- Total payé : {{total}}

Récapitulatif :
{{orderLines}}

Merci pour votre confiance.`
    },
    en: {
      subject: 'Payment confirmed - {{orderNumber}}',
      body: `Hello {{customerName}},

The payment for your order {{orderNumber}} has been confirmed.

- Delivery: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}
- Total paid: {{total}}

Summary:
{{orderLines}}

Thank you for your trust.`
    }
  },
  shop_order_payment_failed: {
    fr: {
      subject: 'Paiement échoué - {{orderNumber}}',
      body: `Bonjour {{customerName}},

Le paiement de votre commande {{orderNumber}} n’a pas pu être confirmé.

- Raison : {{failureReason}}
- Total concerné : {{total}}

Récapitulatif :
{{orderLines}}

Vous pouvez recommencer le paiement si un nouveau lien vous est proposé ou contacter l’équipe du site.`
    },
    en: {
      subject: 'Payment failed - {{orderNumber}}',
      body: `Hello {{customerName}},

The payment for your order {{orderNumber}} could not be confirmed.

- Reason: {{failureReason}}
- Affected total: {{total}}

Summary:
{{orderLines}}

You can retry the payment if a new link is provided or contact the site team.`
    }
  },
  shop_order_cancelled: {
    fr: {
      subject: 'Commande annulée - {{orderNumber}}',
      body: `Bonjour {{customerName}},

Votre commande {{orderNumber}} a été annulée.

- Livraison : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}

Si besoin, vous pouvez contacter l’équipe du site pour plus d’informations.`
    },
    en: {
      subject: 'Order cancelled - {{orderNumber}}',
      body: `Hello {{customerName}},

Your order {{orderNumber}} has been cancelled.

- Delivery: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}

If needed, you can contact the site team for more information.`
    }
  },
  shop_order_admin_validated: {
    fr: {
      subject: 'Nouvelle commande validée - {{orderNumber}}',
      body: `Une commande est prête à être traitée.

- Commande : {{orderNumber}}
- Client : {{customerName}}
- Email : {{customerEmail}}
- Téléphone : {{customerPhone}}
- Message : {{customerMessage}}
- Livraison : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Lieu : {{fulfillmentLocation}}
- Paiement : {{paymentProvider}}
- Statut du paiement : {{paymentStatus}}
- Sous-total : {{subtotal}}
- Total : {{total}}

Lignes :
{{orderLines}}

Ouvrir l’admin :
{{adminOrderUrl}}`
    },
    en: {
      subject: 'New validated order - {{orderNumber}}',
      body: `An order is ready to be processed.

- Order: {{orderNumber}}
- Customer: {{customerName}}
- Email: {{customerEmail}}
- Phone: {{customerPhone}}
- Message: {{customerMessage}}
- Delivery: {{deliveryMethod}}
- Date: {{fulfillmentDate}}
- Time: {{fulfillmentTime}}
- Location: {{fulfillmentLocation}}
- Payment: {{paymentProvider}}
- Payment status: {{paymentStatus}}
- Subtotal: {{subtotal}}
- Total: {{total}}

Lines:
{{orderLines}}

Open admin:
{{adminOrderUrl}}`
    }
  }
}

const SYSTEM_TEMPLATE_DEFINITIONS: AdminEmailTemplateDefinition[] = [
  {
    action: 'shop_order_created',
    settingKey: SETTING_KEYS.SHOP_ORDER_TEMPLATE_CREATED,
    label: localized('Commande reçue client', 'Customer order received'),
    description: localized('Email envoyé au client dès la création d’une commande shop.', 'Email sent to the customer as soon as a shop order is created.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['orderNumber', 'customerName', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'paymentProvider', 'paymentStatus', 'total', 'orderLines'],
    locked: true,
    system: true
  },
  {
    action: 'shop_order_payment_confirmed',
    settingKey: SETTING_KEYS.SHOP_ORDER_TEMPLATE_PAYMENT_CONFIRMED,
    label: localized('Paiement confirmé client', 'Customer payment confirmed'),
    description: localized('Email envoyé au client quand le paiement d’une commande shop est confirmé.', 'Email sent to the customer when a shop order payment is confirmed.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['orderNumber', 'customerName', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'total', 'orderLines'],
    locked: true,
    system: true
  },
  {
    action: 'shop_order_payment_failed',
    settingKey: SETTING_KEYS.SHOP_ORDER_TEMPLATE_PAYMENT_FAILED,
    label: localized('Paiement échoué client', 'Customer payment failed'),
    description: localized('Email envoyé au client quand le paiement d’une commande shop échoue.', 'Email sent to the customer when a shop order payment fails.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['orderNumber', 'customerName', 'failureReason', 'total', 'orderLines'],
    locked: true,
    system: true
  },
  {
    action: 'shop_order_cancelled',
    settingKey: SETTING_KEYS.SHOP_ORDER_TEMPLATE_CANCELLED,
    label: localized('Commande annulée client', 'Customer order cancelled'),
    description: localized('Email envoyé au client quand une commande shop est annulée.', 'Email sent to the customer when a shop order is cancelled.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['orderNumber', 'customerName', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation'],
    locked: true,
    system: true
  },
  {
    action: 'shop_order_admin_validated',
    settingKey: SETTING_KEYS.SHOP_ORDER_TEMPLATE_ADMIN_VALIDATED,
    label: localized('Commande validée admin', 'Validated order admin'),
    description: localized('Notification admin envoyée quand une commande shop est validée et prête à être traitée.', 'Admin notification sent when a shop order is validated and ready to be processed.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_ADMIN,
    variables: ['orderNumber', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'paymentProvider', 'paymentStatus', 'subtotal', 'total', 'orderLines', 'adminOrderUrl'],
    locked: true,
    system: true
  },
  {
    action: 'confirmed',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    label: localized('Confirmation client', 'Customer confirmation'),
    description: localized('Email envoyé quand une commande est confirmée.', 'Email sent when an order is confirmed.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName', 'basketName', 'basketPrice', 'deliveryMethod', 'deliveryWindow', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminNote'],
    locked: true,
    system: true
  },
  {
    action: 'rejected',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
    label: localized('Refus client', 'Customer rejection'),
    description: localized('Email envoyé quand une commande est refusée.', 'Email sent when an order is rejected.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName', 'basketName', 'adminNote'],
    locked: true,
    system: true
  },
  {
    action: 'cancelled',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED,
    label: localized('Annulation client', 'Customer cancellation'),
    description: localized('Email envoyé quand une commande est annulée par l’admin.', 'Email sent when an order is cancelled by the admin.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName', 'basketName', 'adminNote'],
    locked: true,
    system: true
  },
  {
    action: 'proposed',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_PROPOSED,
    label: localized('Contre-proposition client', 'Customer counter-proposal'),
    description: localized('Email envoyé quand l’admin propose un autre créneau pour une commande.', 'Email sent when the admin proposes another slot for an order.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName', 'basketName', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation'],
    locked: true,
    system: true
  },
  {
    action: 'created',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CREATED,
    label: localized('Accusé de réception client', 'Customer acknowledgement'),
    description: localized('Email envoyé juste après la création d’une commande.', 'Email sent right after an order is created.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName', 'basketName', 'basketPrice', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation'],
    locked: true,
    system: true
  },
  {
    action: 'accepted_proposal',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ACCEPTED_PROPOSAL,
    label: localized('Acceptation de proposition client', 'Customer proposal acceptance'),
    description: localized('Email envoyé quand le client accepte un créneau proposé pour sa commande.', 'Email sent when the customer accepts a proposed slot for their order.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation'],
    locked: true,
    system: true
  },
  {
    action: 'cancelled_by_customer',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED_BY_CUSTOMER,
    label: localized('Annulation par le client', 'Cancelled by customer'),
    description: localized('Email de confirmation envoyé au client après l’annulation de sa commande.', 'Confirmation email sent to the customer after cancelling their order.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_CUSTOMER,
    variables: ['customerName'],
    locked: true,
    system: true
  },
  {
    action: 'stopped_subscription',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_STOPPED_SUBSCRIPTION,
    label: localized('Arrêt abonnement client', 'Customer subscription stop'),
    description: localized('Email envoyé au client après arrêt de son abonnement.', 'Email sent to the customer after stopping the subscription.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_SUBSCRIPTION_CUSTOMER,
    variables: ['customerName'],
    locked: true,
    system: true
  },
  {
    action: 'cancelled_occurrence',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED_OCCURRENCE,
    label: localized('Annulation occurrence client', 'Customer occurrence cancellation'),
    description: localized('Email envoyé pour annuler une seule occurrence.', 'Email sent to cancel a single occurrence.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_SUBSCRIPTION_CUSTOMER,
    variables: ['customerName', 'basketName'],
    locked: true,
    system: true
  },
  {
    action: 'updated_occurrence',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_UPDATED_OCCURRENCE,
    label: localized('Mise à jour occurrence client', 'Customer occurrence update'),
    description: localized('Email envoyé quand une occurrence est déplacée ou modifiée.', 'Email sent when an occurrence is moved or updated.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_SUBSCRIPTION_CUSTOMER,
    variables: ['customerName', 'basketName', 'previousDate', 'previousTime', 'previousLocation', 'nextDate', 'nextTime', 'nextLocation'],
    locked: true,
    system: true
  },
  {
    action: 'admin_new_reservation',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_NEW_RESERVATION,
    label: localized('Nouvelle commande admin', 'New order admin'),
    description: localized('Notification admin à la création d’une commande.', 'Admin notification when an order is created.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_ADMIN,
    variables: ['contextLine', 'reservationId', 'basketName', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminReservationUrl'],
    locked: true,
    system: true
  },
  {
    action: 'admin_customer_proposed_slot',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_PROPOSED_SLOT,
    label: localized('Proposition client admin', 'Customer proposal admin'),
    description: localized('Notification admin quand un client propose un autre créneau pour sa commande.', 'Admin notification when a customer proposes another slot for an order.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_ADMIN,
    variables: ['contextLine', 'reservationId', 'basketName', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminReservationUrl'],
    locked: true,
    system: true
  },
  {
    action: 'admin_customer_accepted_proposal',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_ACCEPTED_PROPOSAL,
    label: localized('Proposition acceptée admin', 'Accepted proposal admin'),
    description: localized('Notification admin quand un client accepte un créneau pour sa commande.', 'Admin notification when a customer accepts a slot for an order.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_ADMIN,
    variables: ['contextLine', 'reservationId', 'basketName', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'deliveryMethod', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation', 'adminReservationUrl'],
    locked: true,
    system: true
  },
  {
    action: 'admin_customer_cancelled',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED,
    label: localized('Annulation client vers admin', 'Customer cancellation to admin'),
    description: localized('Notification admin quand un client annule sa commande.', 'Admin notification when a customer cancels an order.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_ORDER_ADMIN,
    variables: ['contextLine', 'basketName', 'customerName', 'customerEmail'],
    locked: true,
    system: true
  },
  {
    action: 'admin_customer_stopped_subscription',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_STOPPED_SUBSCRIPTION,
    label: localized('Arrêt abonnement vers admin', 'Subscription stop to admin'),
    description: localized('Notification admin quand un client arrête son abonnement.', 'Admin notification when a customer stops a subscription.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_SUBSCRIPTION_ADMIN,
    variables: ['contextLine', 'basketName', 'customerName', 'customerEmail'],
    locked: true,
    system: true
  },
  {
    action: 'admin_customer_cancelled_occurrence',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED_OCCURRENCE,
    label: localized('Annulation occurrence vers admin', 'Occurrence cancellation to admin'),
    description: localized('Notification admin quand un client annule une occurrence.', 'Admin notification when a customer cancels an occurrence.'),
    group: GROUP_ORDERS,
    subgroup: SUBGROUP_SUBSCRIPTION_ADMIN,
    variables: ['contextLine', 'basketName', 'customerName', 'customerEmail', 'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation'],
    locked: true,
    system: true
  },
  {
    action: 'contact',
    settingKey: SETTING_KEYS.RESERVATION_TEMPLATE_CONTACT,
    label: localized('Formulaire de contact', 'Contact form'),
    description: localized('Email reçu par l’admin depuis le formulaire de contact.', 'Email received by the admin from the contact form.'),
    group: GROUP_FORMS,
    subgroup: SUBGROUP_FORM_CONTACT,
    variables: ['contactName', 'contactEmail', 'contactMessage'],
    locked: true,
    system: true
  },
  {
    action: 'event_call_for_participation',
    settingKey: SETTING_KEYS.EVENT_TEMPLATE_CALL_FOR_PARTICIPATION,
    label: localized('Appel à participation', 'Call for participation'),
    description: localized('Email envoyé pour inviter des participants à un événement.', 'Email sent to invite participants to an event.'),
    group: GROUP_EVENTS,
    subgroup: SUBGROUP_EVENT_PARTICIPATION_CUSTOMER,
    variables: ['recipientName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'eventDescription', 'eventParticipationUrl'],
    locked: true,
    system: true
  },
  {
    action: 'event_participation_confirmation',
    settingKey: SETTING_KEYS.EVENT_TEMPLATE_PARTICIPATION_CONFIRMATION,
    label: localized('Confirmation participation', 'Participation confirmation'),
    description: localized('Email envoyé pour confirmer une participation.', 'Email sent to confirm a participation.'),
    group: GROUP_EVENTS,
    subgroup: SUBGROUP_EVENT_PARTICIPATION_CUSTOMER,
    variables: ['participantName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation'],
    locked: true,
    system: true
  },
  {
    action: 'public_event_reservation_confirmation',
    settingKey: SETTING_KEYS.EVENT_TEMPLATE_PUBLIC_RESERVATION_CONFIRMATION,
    label: localized('Confirmation réservation publique', 'Public reservation confirmation'),
    description: localized('Email envoyé pour confirmer une réservation publique à un événement.', 'Email sent to confirm a public reservation for an event.'),
    group: GROUP_EVENTS,
    subgroup: SUBGROUP_EVENT_PUBLIC_RESERVATION_CUSTOMER,
    variables: ['customerName', 'eventTitle', 'eventDate', 'eventTime', 'eventLocation', 'reservationSeats'],
    locked: true,
    system: true
  },
  {
    action: 'admin_new_event_participation',
    settingKey: SETTING_KEYS.EVENT_TEMPLATE_ADMIN_NEW_PARTICIPATION,
    label: localized('Nouvelle participation admin', 'New participation admin'),
    description: localized('Notification admin pour une nouvelle participation à un événement.', 'Admin notification for a new event participation.'),
    group: GROUP_EVENTS,
    subgroup: SUBGROUP_EVENT_PARTICIPATION_ADMIN,
    variables: ['participantName', 'participantEmail', 'participantPhone', 'participantMessage', 'eventTitle', 'adminEventUrl'],
    locked: true,
    system: true
  },
  {
    action: 'admin_new_public_event_reservation',
    settingKey: SETTING_KEYS.EVENT_TEMPLATE_ADMIN_NEW_PUBLIC_RESERVATION,
    label: localized('Nouvelle réservation publique admin', 'New public reservation admin'),
    description: localized('Notification admin pour une nouvelle réservation publique à un événement.', 'Admin notification for a new public event reservation.'),
    group: GROUP_EVENTS,
    subgroup: SUBGROUP_EVENT_PUBLIC_RESERVATION_ADMIN,
    variables: ['reservationId', 'customerName', 'customerEmail', 'customerPhone', 'customerMessage', 'reservationSeats', 'eventTitle', 'adminEventUrl'],
    locked: true,
    system: true
  },
  {
    action: 'signup_request',
    settingKey: SETTING_KEYS.SIGNUP_TEMPLATE_REQUEST,
    label: localized('Demande d’inscription', 'Signup request'),
    description: localized('Notification admin pour une nouvelle demande d’inscription.', 'Admin notification for a new signup request.'),
    group: GROUP_FORMS,
    subgroup: SUBGROUP_FORM_SIGNUPS,
    variables: ['signupLabel', 'applicantName', 'applicantEmail', 'applicantPhone', 'applicantMessage', 'adminSignupUrl'],
    locked: true,
    system: true
  },
  {
    action: 'signup_request_confirmation',
    settingKey: SETTING_KEYS.SIGNUP_TEMPLATE_REQUEST_CONFIRMATION,
    label: localized('Confirmation client d’inscription', 'Customer signup confirmation'),
    description: localized('Email de confirmation envoyé au client après une demande d’inscription.', 'Confirmation email sent to the customer after a signup request.'),
    group: GROUP_FORMS,
    subgroup: SUBGROUP_FORM_SIGNUPS,
    variables: ['signupLabel', 'applicantName'],
    locked: true,
    system: true
  },
  {
    action: 'user_invitation',
    settingKey: SETTING_KEYS.USER_INVITATION_TEMPLATE,
    label: localized('Invitation utilisateur', 'User invitation'),
    description: localized('Email envoyé à un utilisateur créé par un admin pour activer son compte.', 'Email sent to an admin-created user to activate their account.'),
    group: GROUP_USERS,
    subgroup: SUBGROUP_USER_ONBOARDING,
    variables: ['recipientName', 'email', 'passwordSetupUrl', 'expiresAt'],
    locked: true,
    system: true
  }
]

function parseLocalizedText(value: unknown, fallback: string) {
  if (!value || typeof value !== 'object') return localized(fallback, fallback)
  const source = value as Record<string, unknown>
  const fr = typeof source.fr === 'string' && source.fr.trim() ? source.fr.trim() : fallback
  const en = typeof source.en === 'string' && source.en.trim() ? source.en.trim() : fr
  return { fr, en }
}

function parseCustomTemplateDefinitions(raw: string | null): StoredCustomTemplateDefinition[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item) => {
        const action = typeof item.action === 'string' ? sanitizeTemplateAction(item.action) : ''
        if (!action) return null
        return {
          action,
          label: parseLocalizedText(item.label, action),
          description: parseLocalizedText(item.description, ''),
          group: parseLocalizedText(item.group, 'Custom'),
          subgroup: parseLocalizedText(item.subgroup, 'General'),
          variables: Array.isArray(item.variables)
            ? item.variables.filter((value): value is string => typeof value === 'string').map(value => value.trim()).filter(Boolean)
            : []
        }
      })
      .filter((item): item is StoredCustomTemplateDefinition => item !== null)
  } catch {
    return []
  }
}

function serializeCustomTemplateDefinitions(definitions: StoredCustomTemplateDefinition[]) {
  return JSON.stringify(definitions)
}

function getCustomTemplateSettingKey(action: string) {
  return `${CUSTOM_TEMPLATE_PREFIX}${action}`
}

function normalizeTemplateLocaleKey(locale: string | null | undefined) {
  const normalized = String(locale || '').trim().toLowerCase()
  return normalized || 'fr'
}

function getDefaultCustomTemplate(locale: string): EmailTemplate {
  return normalizeTemplateLocaleKey(locale) === 'en'
    ? { subject: '', body: '' }
    : { subject: '', body: '' }
}

function getDefaultSystemTemplate(action: string, locale: string): EmailTemplate {
  const normalizedLocale = normalizeTemplateLocaleKey(locale)
  return CUSTOM_TEMPLATE_DEFAULTS[action]?.[normalizedLocale as 'fr' | 'en']
    ?? CUSTOM_TEMPLATE_DEFAULTS[action]?.en
    ?? CUSTOM_TEMPLATE_DEFAULTS[action]?.fr
    ?? getDefaultCustomTemplate(normalizedLocale)
}

function resolveLocalizedTemplate(raw: string | null, locale: string, fallback: EmailTemplate): EmailTemplate {
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const normalizedLocale = normalizeTemplateLocaleKey(locale)
    const languageLocale = normalizedLocale.split('-')[0] || normalizedLocale
    const candidate = parsed?.[normalizedLocale] ?? parsed?.[languageLocale]
    if (candidate && typeof candidate === 'object') {
      const subject = typeof (candidate as Record<string, unknown>).subject === 'string'
        ? (candidate as Record<string, unknown>).subject as string
        : fallback.subject
      const body = typeof (candidate as Record<string, unknown>).body === 'string'
        ? (candidate as Record<string, unknown>).body as string
        : fallback.body
      return { subject, body }
    }
  } catch {
    return fallback
  }

  return fallback
}

export function sanitizeTemplateAction(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_')
}

export async function getCustomAdminEmailTemplateDefinitions(): Promise<AdminEmailTemplateDefinition[]> {
  const raw = await getSetting(SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS)
  return parseCustomTemplateDefinitions(raw).map(definition => ({
    action: definition.action,
    settingKey: getCustomTemplateSettingKey(definition.action),
    label: definition.label,
    description: definition.description,
    group: definition.group,
    subgroup: definition.subgroup,
    variables: definition.variables,
    locked: false,
    system: false
  }))
}

export async function getAllAdminEmailTemplateDefinitions(): Promise<AdminEmailTemplateDefinition[]> {
  const customDefinitions = await getCustomAdminEmailTemplateDefinitions()
  return [...SYSTEM_TEMPLATE_DEFINITIONS, ...customDefinitions]
}

export async function findAdminEmailTemplateDefinition(action: string) {
  const definitions = await getAllAdminEmailTemplateDefinitions()
  return definitions.find(definition => definition.action === action) ?? null
}

export async function resolveAdminEmailTemplate(action: string, locale: string): Promise<EmailTemplate> {
  const definition = await findAdminEmailTemplateDefinition(action)
  if (!definition) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template introuvable'
    })
  }

  const raw = await getSetting(definition.settingKey)

  if (RESERVATION_ACTIONS.has(action as TemplateAction)) {
    return resolveReservationTemplate(raw, action as TemplateAction, locale)
  }

  return resolveLocalizedTemplate(raw, locale, getDefaultSystemTemplate(action, locale))
}

export async function createCustomAdminEmailTemplate(input: {
  label: string
  description?: string
  group?: string
  subgroup?: string
  variables?: string[]
}) {
  const raw = await getSetting(SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS)
  const existing = parseCustomTemplateDefinitions(raw)
  const systemActions = new Set(SYSTEM_TEMPLATE_DEFINITIONS.map(definition => definition.action))
  const baseAction = sanitizeTemplateAction(input.label) || 'custom_template'

  let action = baseAction
  let suffix = 2
  while (systemActions.has(action) || existing.some(definition => definition.action === action)) {
    action = `${baseAction}_${suffix}`
    suffix += 1
  }

  const stored: StoredCustomTemplateDefinition = {
    action,
    label: localized(input.label.trim(), input.label.trim()),
    description: localized(input.description?.trim() || '', input.description?.trim() || ''),
    group: localized(input.group?.trim() || 'Custom', input.group?.trim() || 'Custom'),
    subgroup: localized(input.subgroup?.trim() || 'General', input.subgroup?.trim() || 'General'),
    variables: (input.variables ?? []).map(value => value.trim()).filter(Boolean)
  }

  await setSetting(
    SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS,
    serializeCustomTemplateDefinitions([...existing, stored])
  )

  return {
    action: stored.action,
    settingKey: getCustomTemplateSettingKey(stored.action),
    label: stored.label,
    description: stored.description,
    group: stored.group,
    subgroup: stored.subgroup,
    variables: stored.variables,
    locked: false,
    system: false
  } satisfies AdminEmailTemplateDefinition
}

export async function syncCustomAdminEmailTemplateDefinition(input: {
  action: string
  label?: string
  description?: string
  group?: string
  subgroup?: string
  variables?: string[]
}) {
  const raw = await getSetting(SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS)
  const existing = parseCustomTemplateDefinitions(raw)
  const index = existing.findIndex(definition => definition.action === input.action)
  if (index < 0) return null

  const current = existing[index]!
  existing[index] = {
    action: current.action,
    label: input.label?.trim()
      ? localized(input.label.trim(), input.label.trim())
      : current.label,
    description: input.description?.trim()
      ? localized(input.description.trim(), input.description.trim())
      : current.description,
    group: input.group?.trim()
      ? localized(input.group.trim(), input.group.trim())
      : current.group,
    subgroup: input.subgroup?.trim()
      ? localized(input.subgroup.trim(), input.subgroup.trim())
      : current.subgroup,
    variables: Array.from(new Set((input.variables ?? current.variables).map(value => value.trim()).filter(Boolean))).sort()
  }

  await setSetting(
    SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS,
    serializeCustomTemplateDefinitions(existing)
  )

  return {
    action: existing[index]!.action,
    settingKey: getCustomTemplateSettingKey(existing[index]!.action),
    label: existing[index]!.label,
    description: existing[index]!.description,
    group: existing[index]!.group,
    subgroup: existing[index]!.subgroup,
    variables: existing[index]!.variables,
    locked: false,
    system: false
  } satisfies AdminEmailTemplateDefinition
}

export async function deleteCustomAdminEmailTemplate(action: string) {
  const raw = await getSetting(SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS)
  const existing = parseCustomTemplateDefinitions(raw)
  const next = existing.filter(definition => definition.action !== action)

  if (next.length === existing.length) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template introuvable'
    })
  }

  await setSetting(
    SETTING_KEYS.CUSTOM_EMAIL_TEMPLATE_DEFINITIONS,
    serializeCustomTemplateDefinitions(next)
  )
  await deleteSetting(getCustomTemplateSettingKey(action))
}
