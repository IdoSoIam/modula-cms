import { prisma } from '../../prisma/client'

export const SETTING_KEYS = {
  ADMIN_EMAIL: 'admin_email',
  RESERVATION_TEMPLATE_CONFIRMED: 'reservation_template_confirmed',
  RESERVATION_TEMPLATE_REJECTED: 'reservation_template_rejected',
  RESERVATION_TEMPLATE_CANCELLED: 'reservation_template_cancelled',
  GMAIL_REFRESH_TOKEN: 'gmail_refresh_token',
  GMAIL_ACCESS_TOKEN: 'gmail_access_token',
  GMAIL_TOKEN_EXPIRY: 'gmail_token_expiry',
  GMAIL_CONNECTED_EMAIL: 'gmail_connected_email',
  GOOGLE_CALENDAR_ID: 'google_calendar_id',
  GOOGLE_CALENDAR_NAME: 'google_calendar_name',
  FACEBOOK_FLUX_DEACTIVATED: 'facebook_flux_deactivated',
  ORDERS_OPEN_FROM: 'orders_open_from',
  ORDERS_OPEN_TO: 'orders_open_to',
  ORDERS_CLOSED_MESSAGE: 'orders_closed_message'
} as const

export interface OrdersWindow {
  from: string | null
  to: string | null
  message: string
  isOpen: boolean
}

export async function getOrdersWindow(): Promise<OrdersWindow> {
  const s = await getSettings([
    SETTING_KEYS.ORDERS_OPEN_FROM,
    SETTING_KEYS.ORDERS_OPEN_TO,
    SETTING_KEYS.ORDERS_CLOSED_MESSAGE
  ])
  const from = s[SETTING_KEYS.ORDERS_OPEN_FROM] || null
  const to = s[SETTING_KEYS.ORDERS_OPEN_TO] || null
  const message = s[SETTING_KEYS.ORDERS_CLOSED_MESSAGE] || ''
  const now = new Date()
  const fromOk = !from || new Date(from) <= now
  const toOk = !to || new Date(`${to}T23:59:59`) >= now
  return { from, to, message, isOpen: fromOk && toOk }
}

export const DEFAULT_TEMPLATES = {
  confirmed: {
    subject: 'Votre reservation de panier est confirmee - Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Votre reservation pour le panier "{{basketName}}" est confirmee !

Details de retrait :
- Mode : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Fenetre de passage : {{deliveryWindow}}
- Lieu : {{fulfillmentLocation}}
- Montant : {{basketPrice}}

Le paiement se fait en especes au retrait ou a la remise du panier.

Si vous avez la moindre question, vous pouvez repondre a cet email.

A bientot,
La Ferme du Campeyrigoux`
  },
  rejected: {
    subject: 'Concernant votre reservation de panier - Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Nous sommes desoles, votre reservation pour le panier "{{basketName}}" n'a pas pu etre confirmee.

Raison : {{adminNote}}

N'hesitez pas a nous recontacter pour une prochaine reservation.

La Ferme du Campeyrigoux`
  },
  cancelled: {
    subject: 'Votre reservation a ete annulee - Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Votre reservation pour le panier "{{basketName}}" a ete annulee.

Raison : {{adminNote}}

Si besoin, vous pouvez nous contacter directement pour en discuter.

La Ferme du Campeyrigoux`
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.siteParams.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteParams.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}

export async function deleteSetting(key: string): Promise<void> {
  await prisma.siteParams.deleteMany({
    where: { key }
  })
}

export async function deleteSettings(keys: string[]): Promise<void> {
  if (!keys.length) return

  await prisma.siteParams.deleteMany({
    where: { key: { in: keys } }
  })
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteParams.findMany({ where: { key: { in: keys } } })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}
