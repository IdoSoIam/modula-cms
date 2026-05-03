import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

function toPositiveInt(value: unknown, fallback: number, max = 100) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
}

function serializeReservation(r: any) {
  return {
    id: r.id,
    customerName: r.customerName,
    email: r.email,
    phone: r.phone,
    message: r.message,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: r.createdAt,
    confirmedAt: r.confirmedAt,
    basket: { id: r.basket.id, name: r.basket.name, finalPrice: Number(r.basket.finalPrice) },
    deliveryType: r.deliveryType,
    deliveryAddress: r.deliveryAddress,
    deliveryCity: r.deliveryCity,
    deliveryPostalCode: r.deliveryPostalCode,
    fulfillmentDate: r.fulfillmentDate,
    fulfillmentTime: r.fulfillmentTime,
    fulfillmentLocation: r.fulfillmentLocation,
    monthlySubscription: r.monthlySubscription,
    subscriptionActive: r.subscriptionActive,
    subscriptionCancelledAt: r.subscriptionCancelledAt,
    googleCalendarEventId: r.googleCalendarEventId,
    googleCalendarSyncedAt: r.googleCalendarSyncedAt,
    occurrences: [],
    notifications: [],
    pickupPoint: r.pickupPoint ? { id: r.pickupPoint.id, name: r.pickupPoint.name, address: r.pickupPoint.address } : null,
    deliveryTour: r.deliveryTour ? {
      id: r.deliveryTour.id,
      name: r.deliveryTour.name,
      dayOfWeek: r.deliveryTour.dayOfWeek,
      startTime: r.deliveryTour.startTime,
      endTime: r.deliveryTour.endTime,
      monthlyPrice: r.deliveryTour.monthlyPrice ? Number(r.deliveryTour.monthlyPrice) : null,
      cities: r.deliveryTour.cities?.map((c: any) => c.city) ?? []
    } : null
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function parseDayPages(value: unknown) {
  if (typeof value !== 'string' || !value) return {}
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed ? parsed as Record<string, number> : {}
  } catch {
    return {}
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const mode = query.mode === 'calendar' ? 'calendar' : 'list'

  const include = {
    basket: true,
    pickupPoint: true,
    deliveryTour: { include: { cities: true } }
  }

  if (mode === 'calendar') {
    const month = typeof query.month === 'string' && /^\d{4}-\d{2}$/.test(query.month)
      ? query.month
      : new Date().toISOString().slice(0, 7)
    const [year = new Date().getFullYear(), monthIndex = new Date().getMonth() + 1] = month.split('-').map(Number)
    const monthStart = startOfMonth(new Date(year, monthIndex - 1, 1))
    const gridStart = startOfWeek(monthStart)
    const monthEnd = endOfMonth(monthStart)
    const gridEnd = new Date(monthEnd)
    const endDay = gridEnd.getDay()
    gridEnd.setDate(gridEnd.getDate() + (endDay === 0 ? 0 : 7 - endDay))
    gridEnd.setHours(23, 59, 59, 999)

    const items = await prisma.reservation.findMany({
      where: {
        archivedAt: null,
        OR: [
          { fulfillmentDate: { gte: gridStart, lte: gridEnd } },
          { fulfillmentDate: null, createdAt: { gte: gridStart, lte: gridEnd } }
        ]
      },
      orderBy: [{ fulfillmentDate: 'asc' }, { createdAt: 'asc' }],
      include
    })
    const serialized = items.map(serializeReservation)
    const perPage = toPositiveInt(query.perDayLimit, 3, 20)
    const dayPages = parseDayPages(query.dayPages)

    const days = []
    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
      const date = new Date(cursor)
      const iso = date.toISOString().slice(0, 10)
      const dayItems = serialized.filter((reservation) => {
        const source = reservation.fulfillmentDate ?? reservation.createdAt
        return sameDay(new Date(source), date)
      })
      const totalPages = Math.max(1, Math.ceil(dayItems.length / perPage))
      const page = Math.min(Math.max(Number(dayPages[iso] ?? 1), 1), totalPages)
      days.push({
        iso,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === monthStart.getMonth(),
        isToday: sameDay(date, new Date()),
        page,
        perPage,
        total: dayItems.length,
        totalPages,
        items: dayItems.slice((page - 1) * perPage, page * perPage)
      })
    }

    return { mode, days }
  }

  const page = toPositiveInt(query.page, 1)
  const perPage = toPositiveInt(query.limit, 10, 50)
  const [total, items] = await Promise.all([
    prisma.reservation.count({ where: { archivedAt: null } }),
    prisma.reservation.findMany({
      where: { archivedAt: null },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include
    })
  ])
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return {
    mode,
    items: items.map(serializeReservation),
    pagination: { page, perPage, total, totalPages }
  }
})
