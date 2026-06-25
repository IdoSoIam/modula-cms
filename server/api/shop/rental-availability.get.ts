import { db } from '#modula/server/data/client'
import {
  computeAvailabilityForSource,
  eachDayBetween,
  endOfDay,
  startOfDay,
  toIsoDate,
} from '#modula/server/services/shop/rentalAvailability'
import { serializeProduct, serializeProductLot } from '#modula/server/utils/shop'

function parseMonth(value: string | undefined) {
  const source = value && /^\d{4}-\d{2}$/.test(value) ? value : toIsoDate(new Date()).slice(0, 7)
  const [year, month] = source.split('-').map(Number)
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
  const query = getQuery(event)
  const kind = query.kind === 'productLot' ? 'productLot' : query.kind === 'product' ? 'product' : ''
  const id = Number(query.id || 0)
  if (!kind || !id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Source de location invalide',
    })
  }

  const monthDate = parseMonth(typeof query.month === 'string' ? query.month : undefined)
  const { gridDays } = buildCalendarDays(monthDate)
  const gridStart = startOfDay(gridDays[0])
  const gridEnd = endOfDay(gridDays[gridDays.length - 1])

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
    }, gridStart, gridEnd)
    return buildResponse(monthDate, gridDays, availability, product)
  }

  const row = await db.productLot.findUnique({
    where: { id, active: true },
    include: {
      category: true,
      items: {
        include: {
          product: {
            include: { category: true },
          },
        },
      },
    },
  })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Lot introuvable' })
  }
  const lot = serializeProductLot(row)
  const availability = await computeAvailabilityForSource({
    kind,
    id: lot.id,
    title: lot.name,
    stock: lot.stock,
    rentalAvailableFrom: lot.rentalAvailableFrom,
    rentalAvailableTo: lot.rentalAvailableTo,
    rentalMinDays: lot.rentalMinDays,
    rentalMaxDays: lot.rentalMaxDays,
  }, gridStart, gridEnd)
  return buildResponse(monthDate, gridDays, availability, lot)
})

function buildResponse(monthDate: Date, gridDays: Date[], availability: Awaited<ReturnType<typeof computeAvailabilityForSource>>, source: any) {
  const labels = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
  const dayNames = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(2026, 0, 5 + index)
    const label = labels.format(date)
    return label.charAt(0).toUpperCase() + label.slice(1).replace('.', '')
  })

  const byIso = new Map(availability.map((entry) => [entry.iso, entry]))
  return {
    month: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
    monthInput: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
    monthLabel: new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(monthDate),
    dayNames,
    source,
    days: gridDays.map((day) => {
      const iso = toIsoDate(day)
      const state = byIso.get(iso)
      const inCurrentMonth = day.getMonth() === monthDate.getMonth()
      const item = state
        ? {
            id: iso,
            title: state.status === 'full'
              ? 'Complet'
              : state.status === 'outside'
                ? 'Indisponible'
                : `${state.remaining} dispo.`,
            subtitle: state.reserved > 0 ? `${state.reserved} réservé(s)` : '',
            meta: state.status === 'partial' ? 'Disponibilité partielle' : '',
            status: state.status,
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
        availabilityStatus: state?.status || 'outside',
        remaining: state?.remaining || 0,
        selectable: Boolean(state?.selectable),
      }
    }),
  }
}
