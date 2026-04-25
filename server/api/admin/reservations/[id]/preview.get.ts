import { requireAdmin } from '~/server/utils/requireAdmin'
import { getSettings, SETTING_KEYS, DEFAULT_TEMPLATES } from '~/server/utils/settings'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const r = await prisma.reservation.findUnique({ where: { id }, include: { basket: true } })
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })

  const action = String(getQuery(event).action ?? 'confirmed') as 'confirmed' | 'rejected'
  const settings = await getSettings([
    SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED
  ])
  const raw = action === 'confirmed'
    ? settings[SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED]
    : settings[SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED]
  const fallback = action === 'confirmed' ? DEFAULT_TEMPLATES.confirmed : DEFAULT_TEMPLATES.rejected
  let tpl: { subject: string; body: string }
  try { tpl = raw ? JSON.parse(raw) : fallback } catch { tpl = fallback }

  const replace = (s: string) => s
    .replace(/\{\{customerName\}\}/g, r.customerName)
    .replace(/\{\{basketName\}\}/g, r.basket.name)
    .replace(/\{\{basketPrice\}\}/g, new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(r.basket.finalPrice)))
    .replace(/\{\{adminNote\}\}/g, r.adminNote ?? '')

  return {
    to: r.email,
    subject: replace(tpl.subject),
    body: replace(tpl.body)
  }
})
