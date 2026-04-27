import { prisma } from '../../prisma/client'

export const SETTING_KEYS = {
  ADMIN_EMAIL: 'admin_email',
  RESERVATION_TEMPLATE_CONFIRMED: 'reservation_template_confirmed',
  RESERVATION_TEMPLATE_REJECTED: 'reservation_template_rejected',
  GMAIL_REFRESH_TOKEN: 'gmail_refresh_token',
  GMAIL_ACCESS_TOKEN: 'gmail_access_token',
  GMAIL_TOKEN_EXPIRY: 'gmail_token_expiry',
  GMAIL_CONNECTED_EMAIL: 'gmail_connected_email',
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
  const toOk = !to || new Date(to + 'T23:59:59') >= now
  return { from, to, message, isOpen: fromOk && toOk }
}

export const DEFAULT_TEMPLATES = {
  confirmed: {
    subject: 'Votre réservation de panier est confirmée — Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Votre réservation pour le panier "{{basketName}}" est confirmée !

Détails de retrait :
- Date : (à compléter par l'admin)
- Lieu : (à compléter par l'admin)
- Montant : {{basketPrice}}

Si vous avez la moindre question, vous pouvez répondre à cet email.

À bientôt,
La Ferme du Campeyrigoux`
  },
  rejected: {
    subject: 'Concernant votre réservation de panier — Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Nous sommes désolés, votre réservation pour le panier "{{basketName}}" n'a pas pu être confirmée.

Raison : {{adminNote}}

N'hésitez pas à nous recontacter pour une prochaine réservation.

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

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteParams.findMany({ where: { key: { in: keys } } })
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}
