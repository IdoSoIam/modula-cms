import { db } from '#modula/server/data/client'
import {
  computeAvailabilityForSource,
  computeRentalSlots,
  eachDayBetween,
  endOfDay,
  startOfDay,
  toIsoDate,
} from '#modula/server/services/shop/rentalAvailability'
import { formatLocalizedDateValue } from '#modula/shared/date'
import { serializeProduct } from '#modula/server/utils/shop'
import { getFeatureFlags, getRentalCalendarConfig } from '#modula/server/utils/settings'
import { getRentalOpeningRanges } from '#modula/shared/rentalCalendar'

function parseMonth(value: string | undefined) {
  const source = value && /^\d{4}-\d{2}$/.test(value) ? value : toIsoDate(new Date()).slice(0, 7)
  const [year = new Date().getFullYear(), month = 1] = source.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

function buildCalendarDays(monthDate: Date) {
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const end = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0)
  const firstGridDay = new Date(start)
  firstGridDay.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const lastGridDay = new Date(end)
  lastGridDay.setDate(end.getDate() + (6 - ((end.getDay() + 6) % 7)))
  return {
    start,
    end,
    gridDays: eachDayBetween(firstGridDay, lastGridDay),
  }
}

export default defineEventHandler(async (event) => {
  const featureFlags = await getFeatureFlags()
  if (!featureFlags.shop.enabled || !featureFlags.rentalsEnabled) {
    throw createError({ statusCode: 404, message: 'Location désactivée' })
  }
  const query = getQuery(event)
  const locale = typeof query.locale === 'string' && query.locale.trim() ? query.locale : 'fr'
  const kind = query.kind === 'product' ? 'product' : ''
  const id = Number(query.id || 0)
  if (!kind || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source de location invalide',
    })
  }

  const monthDate = parseMonth(typeof query.month === 'string' ? query.month : undefined)
  const { gridDays } = buildCalendarDays(monthDate)
  if (!gridDays.length) {
    throw createError({ statusCode: 500, statusMessage: 'Calendrier de location invalide' })
  }
  const gridStart = startOfDay(gridDays[0]!)
  const gridEnd = endOfDay(gridDays[gridDays.length - 1]!)

  if (kind === 'product') {
    const row = await db.product.findUnique({
      where: { id, active: true },
      include: { category: true },
    })
    if (!row) {
      throw createError({ statusCode: 404, statusMessage: 'Produit introuvable' })
    }
    const product = serializeProduct(row)
    const availability = await computeAvailabilityForSource({
      kind,
      id: product.id,
      title: product.name,
      stock: product.stock,
      rentalAvailableFrom: product.rentalAvailableFrom,
      rentalAvailableTo: product.rentalAvailableTo,
      rentalMinDays: product.rentalMinDays,
      rentalMaxDays: product.rentalMaxDays,
      rentalBookingMode: product.rentalBookingMode,
      rentalDurations: product.rentalDurations,
      rentalSlotStepMinutes: product.rentalSlotStepMinutes,
    }, gridStart, gridEnd)
    const selectedDate = typeof query.date === 'string' ? query.date : ''
    const duration = Number(query.duration || product.rentalDurations[0] || 60)
    const hourlyMode = product.rentalBookingMode === 'SINGLE_DAY'
      || (product.rentalBookingMode === 'BOTH' && query.mode === 'SINGLE_DAY')
    const slots = hourlyMode && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate)
      ? await computeRentalSlots({
          kind, id: product.id, title: product.name, quantity: 1, stock: product.stock,
          rentalAvailableFrom: product.rentalAvailableFrom, rentalAvailableTo: product.rentalAvailableTo,
          rentalMinDays: product.rentalMinDays, rentalMaxDays: product.rentalMaxDays,
          rentalBookingMode: product.rentalBookingMode, rentalDurations: product.rentalDurations,
          rentalSlotStepMinutes: product.rentalSlotStepMinutes,
        }, selectedDate, duration)
      : []
    const calendar = await getRentalCalendarConfig()
    return { ...buildResponse(monthDate, gridDays, availability, product, locale, calendar), slots }
  }

  throw createError({ statusCode: 400, statusMessage: 'Source de location invalide' })
})

function buildResponse(monthDate: Date, gridDays: Date[], availability: Awaited<ReturnType<typeof computeAvailabilityForSource>>, source: any, locale: string, calendar: Awaited<ReturnType<typeof getRentalCalendarConfig>>) {
  const dayNames = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 0, 5 + index)
    const label = formatLocalizedDateValue(date, locale, { weekday: 'short' })
    return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
  })

  const byIso = new Map(availability.map((entry) => [entry.iso, entry]))
  return {
    month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
    monthInput: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
    monthLabel: formatLocalizedDateValue(monthDate, locale, { month: 'long', year: 'numeric' }),
    dayNames,
    source,
    days: gridDays.map((day) => {
      const iso = toIsoDate(day)
      const state = byIso.get(iso)
      const openingRanges = getRentalOpeningRanges(calendar, iso)
      const calendarClosed = openingRanges.length === 0
      const inCurrentMonth = day.getMonth() === monthDate.getMonth()
      const item = state
        ? {
            id: iso,
            title: '',
            subtitle: '',
            meta: '',
            status: calendarClosed ? 'outside' : state.status,
            remaining: state.remaining,
          }
        : {
            id: iso,
            title: '',
            subtitle: '',
            meta: '',
            status: 'outside',
            remaining: 0,
          }
      return {
        iso,
        dayNumber: day.getDate(),
        inCurrentMonth,
        isToday: iso === toIsoDate(new Date()),
        page: 1,
        total: 1,
        totalPages: 1,
        items: [item],
        availabilityStatus: calendarClosed ? 'outside' : state?.status || 'outside',
        remaining: state?.remaining || 0,
        selectable: Boolean(state?.selectable && !calendarClosed),
        openingRanges,
      }
    }),
  }
}
