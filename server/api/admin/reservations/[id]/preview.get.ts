import { requireAdmin } from '~/server/utils/requireAdmin'
import { getSettings, SETTING_KEYS, DEFAULT_TEMPLATES } from '~/server/utils/settings'
import { formatFulfillmentDate, getDeliveryMethodLabel, getDeliveryWindowLabel, getReservationFulfillment } from '~/server/utils/reservationFulfillment'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const r = await prisma.reservation.findUnique({
    where: { id },
    include: {
      basket: true,
      pickupPoint: { select: { name: true, address: true, deliveryDay: true, pickupStartTime: true } },
      deliveryTour: { select: { name: true, dayOfWeek: true, startTime: true, endTime: true } }
    }
  })
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })

  const action = String(getQuery(event).action ?? 'confirmed') as 'confirmed' | 'rejected' | 'cancelled'
  const settings = await getSettings([
    SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
    SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED
  ])
  const raw = action === 'confirmed'
    ? settings[SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED]
    : action === 'cancelled'
      ? settings[SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED]
      : settings[SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED]
  const fallback = action === 'confirmed'
    ? DEFAULT_TEMPLATES.confirmed
    : action === 'cancelled'
      ? DEFAULT_TEMPLATES.cancelled
      : DEFAULT_TEMPLATES.rejected

  let tpl: { subject: string; body: string }
  try {
    tpl = raw ? JSON.parse(raw) : fallback
  } catch {
    tpl = fallback
  }

  const query = getQuery(event)
  const fulfillment = getReservationFulfillment({
    deliveryType: r.deliveryType,
    pickupPoint: r.pickupPoint,
    deliveryTour: r.deliveryTour,
    deliveryAddress: r.deliveryAddress,
    deliveryCity: r.deliveryCity,
    deliveryPostalCode: r.deliveryPostalCode,
    fulfillmentDate: typeof query.fulfillmentDate === 'string' && query.fulfillmentDate
      ? new Date(`${query.fulfillmentDate}T12:00:00`)
      : r.fulfillmentDate,
    fulfillmentTime: typeof query.fulfillmentTime === 'string'
      ? (query.fulfillmentTime.trim() || null)
      : r.fulfillmentTime,
    fulfillmentLocation: typeof query.fulfillmentLocation === 'string'
      ? (query.fulfillmentLocation.trim() || null)
      : r.fulfillmentLocation
  })

  const replace = (s: string) => s
    .replace(/\{\{customerName\}\}/g, r.customerName)
    .replace(/\{\{basketName\}\}/g, r.basket.name)
    .replace(/\{\{basketPrice\}\}/g, new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(r.basket.finalPrice)))
    .replace(/\{\{adminNote\}\}/g, typeof query.adminNote === 'string' ? query.adminNote : (r.adminNote ?? ''))
    .replace(/\{\{deliveryMethod\}\}/g, getDeliveryMethodLabel(r.deliveryType))
    .replace(/\{\{deliveryWindow\}\}/g, getDeliveryWindowLabel({ deliveryType: r.deliveryType, pickupPoint: r.pickupPoint, deliveryTour: r.deliveryTour }))
    .replace(/\{\{fulfillmentDate\}\}/g, formatFulfillmentDate(fulfillment.fulfillmentDate))
    .replace(/\{\{fulfillmentTime\}\}/g, fulfillment.fulfillmentTime ?? '')
    .replace(/\{\{fulfillmentLocation\}\}/g, fulfillment.fulfillmentLocation ?? '')

  return {
    to: r.email,
    subject: replace(tpl.subject),
    body: replace(tpl.body)
  }
})
