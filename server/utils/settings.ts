import { prisma } from '../../prisma/client'

export const SETTING_KEYS = {
  ADMIN_EMAIL: 'admin_email',
  RESERVATION_TEMPLATE_CONFIRMED: 'reservation_template_confirmed',
  RESERVATION_TEMPLATE_REJECTED: 'reservation_template_rejected',
  GMAIL_REFRESH_TOKEN: 'gmail_refresh_token',
  GMAIL_ACCESS_TOKEN: 'gmail_access_token',
  GMAIL_TOKEN_EXPIRY: 'gmail_token_expiry',
  GMAIL_CONNECTED_EMAIL: 'gmail_connected_email'
} as const

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
