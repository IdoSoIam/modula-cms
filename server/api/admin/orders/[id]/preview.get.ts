import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getSettings, SETTING_KEYS } from '#modula/server/utils/settings'
import { getReservationDateLocale, resolveReservationTemplate } from '#modula/server/utils/orderEmailContent'
import { formatFulfillmentDate, getDeliveryMethodLabel, getDeliveryWindowLabel, getReservationFulfillment } from '#modula/server/utils/orderFulfillment'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const r = await db.reservation.findUnique({
    where: { id },
    include: {
      basket: true,
      pickupPoint: { select: { name: true, address: true, deliveryDay: true, pickupStartTime: true } },
      deliveryTour: { select: { name: true, dayOfWeek: true, startTime: true, endTime: true } }
    }
  })
  if (!r) throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })

  const action = String(getQuery(event).action ?? 'confirmed') as 'confirmed' | 'rejected' | 'cancelled' | 'proposed'
  const settings = await getSettings([
    SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
    SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED
  ])
  const raw = action === 'confirmed'
    ? settings[SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED]
    : action === 'cancelled'
      ? settings[SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED]
      : action === 'proposed'
        ? settings[SETTING_KEYS.RESERVATION_TEMPLATE_PROPOSED]
        : settings[SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED]
  const templateAction = action === 'proposed' ? 'proposed' : action
  const tpl = resolveReservationTemplate(raw, templateAction, r.language)

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
    .replace(/\{\{basketPrice\}\}/g, new Intl.NumberFormat(getReservationDateLocale(r.language), { style: 'currency', currency: 'EUR' }).format(Number(r.basket.finalPrice)))
    .replace(/\{\{adminNote\}\}/g, typeof query.adminNote === 'string' ? query.adminNote : (r.adminNote ?? ''))
    .replace(/\{\{deliveryMethod\}\}/g, getDeliveryMethodLabel(r.deliveryType, r.language))
    .replace(/\{\{deliveryWindow\}\}/g, getDeliveryWindowLabel({ deliveryType: r.deliveryType, pickupPoint: r.pickupPoint, deliveryTour: r.deliveryTour }))
    .replace(/\{\{fulfillmentDate\}\}/g, formatFulfillmentDate(fulfillment.fulfillmentDate, getReservationDateLocale(r.language)))
    .replace(/\{\{fulfillmentTime\}\}/g, fulfillment.fulfillmentTime ?? '')
    .replace(/\{\{fulfillmentLocation\}\}/g, fulfillment.fulfillmentLocation ?? '')

  return {
    to: r.email,
    subject: replace(tpl.subject),
    body: replace(tpl.body)
  }
})
