import { db } from '#modula/server/data/client'
import { computeRentalOpeningDurationSlots, resolveRentalWindow } from '#modula/server/services/shop/rentalAvailability'
import { serializeProduct } from '#modula/server/utils/shop'
import { getFeatureFlags, getRentalCalendarConfig } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  const features = await getFeatureFlags()
  if (!features.shop.enabled || !features.rentalsEnabled) {
    throw createError({ statusCode: 404, message: 'Location désactivée' })
  }

  const query = getQuery(event)
  const productId = Number(query.productId || 0)
  const durationMinutes = Number(query.durationMinutes || 0)
  const quantity = Math.max(1, Math.round(Number(query.quantity || 1)))
  const calendar = await getRentalCalendarConfig()
  const parentWindow = resolveRentalWindow(
    typeof query.parentStart === 'string' ? query.parentStart : null,
    typeof query.parentEnd === 'string' ? query.parentEnd : null,
    calendar.timezone,
  )
  if (!productId || !parentWindow || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw createError({ statusCode: 400, message: 'Période ou accessoire invalide' })
  }
  if (parentWindow.durationDays > 31) {
    throw createError({ statusCode: 400, message: 'La période demandée est trop longue' })
  }

  const row = await db.product.findUnique({ where: { id: productId, active: true, deletedAt: null } })
  if (!row) throw createError({ statusCode: 404, message: 'Accessoire introuvable' })
  const product = serializeProduct(row)
  if (product.saleType !== 'RENTAL' || !product.rentalDurations.includes(durationMinutes)) {
    throw createError({ statusCode: 400, message: 'Durée indisponible pour cet accessoire' })
  }

  const source = {
    kind: 'product' as const,
    id: product.id,
    title: product.name,
    quantity: 1,
    stock: product.stock,
    rentalAvailableFrom: product.rentalAvailableFrom,
    rentalAvailableTo: product.rentalAvailableTo,
    rentalMinDays: product.rentalMinDays,
    rentalMaxDays: product.rentalMaxDays,
    rentalBookingMode: product.rentalBookingMode,
    rentalDurations: product.rentalDurations,
    rentalSlotStepMinutes: product.rentalSlotStepMinutes,
    rentalPricingMode: 'HOURLY' as const,
  }

  const startIso = zonedDate(parentWindow.startAt, calendar.timezone)
  const endIso = zonedDate(parentWindow.endAt, calendar.timezone)
  const slots: Array<{ start: string; end: string; remaining: number }> = []
  for (const iso of eachIsoDate(startIso, endIso)) {
    const daySlots = await computeRentalOpeningDurationSlots(source, iso, durationMinutes)
    slots.push(...daySlots.filter(slot =>
      slot.remaining >= quantity
      && new Date(slot.start).getTime() >= parentWindow.startAt.getTime()
      && new Date(slot.end).getTime() <= parentWindow.endAt.getTime(),
    ))
  }
  return { slots }
})

function eachIsoDate(start: string, end: string) {
  const values: string[] = []
  const cursor = new Date(`${start}T00:00:00Z`)
  const last = new Date(`${end}T00:00:00Z`)
  while (cursor <= last) {
    values.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return values
}

function zonedDate(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
