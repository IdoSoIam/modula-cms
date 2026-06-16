import type { DbTypes } from '#modula/server/data/types'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { ensureReservationOccurrences } from '#modula/server/utils/orderOccurrences'
import { isSubscriptionsEnabled } from '#modula/server/utils/settings'
import { db } from '#modula/server/data/client'

function toPositiveInt(value: unknown, fallback: number, max = 100) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(Math.floor(parsed), max)
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

function getDayStart(date: Date) {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function getReservationDisplayOccurrence(reservation: any, today: Date, subscriptionsEnabled: boolean) {
  if (!subscriptionsEnabled) return null
  const futureOccurrences = (reservation.occurrences ?? [])
    .filter((occurrence: any) => new Date(occurrence.occurrenceDate) >= today)
    .sort((a: any, b: any) => new Date(a.occurrenceDate).getTime() - new Date(b.occurrenceDate).getTime())

  const nextScheduled = futureOccurrences.find((occurrence: any) => occurrence.status === 'SCHEDULED')
  return nextScheduled ?? futureOccurrences[0] ?? null
}

function getReservationDisplayDate(reservation: any, today: Date, subscriptionsEnabled: boolean) {
  const nextOccurrence = getReservationDisplayOccurrence(reservation, today, subscriptionsEnabled)
  return nextOccurrence
    ? new Date(nextOccurrence.occurrenceDate)
    : reservation.fulfillmentDate
      ? new Date(reservation.fulfillmentDate)
      : new Date(reservation.createdAt)
}

function serializeReservation(reservation: any, today: Date, subscriptionsEnabled: boolean) {
  const nextOccurrence = getReservationDisplayOccurrence(reservation, today, subscriptionsEnabled)

  return {
    id: reservation.id,
    customerName: reservation.customerName,
    email: reservation.email,
    language: reservation.language,
    phone: reservation.phone,
    message: reservation.message,
    status: reservation.status,
    adminNote: reservation.adminNote,
    createdAt: reservation.createdAt,
    confirmedAt: reservation.confirmedAt,
    archivedAt: reservation.archivedAt,
    basket: { id: reservation.basket.id, name: reservation.basket.name, finalPrice: Number(reservation.basket.finalPrice) },
    deliveryType: reservation.deliveryType,
    deliveryAddress: reservation.deliveryAddress,
    deliveryCity: reservation.deliveryCity,
    deliveryPostalCode: reservation.deliveryPostalCode,
    fulfillmentDate: reservation.fulfillmentDate,
    fulfillmentTime: reservation.fulfillmentTime,
    fulfillmentLocation: reservation.fulfillmentLocation,
    monthlySubscription: subscriptionsEnabled ? reservation.monthlySubscription : false,
    subscriptionActive: subscriptionsEnabled ? reservation.subscriptionActive : false,
    subscriptionCancelledAt: reservation.subscriptionCancelledAt,
    scheduleProposalPendingBy: reservation.scheduleProposalPendingBy,
    googleCalendarEventId: reservation.googleCalendarEventId,
    googleCalendarSyncedAt: reservation.googleCalendarSyncedAt,
    displayDate: nextOccurrence?.occurrenceDate ?? reservation.fulfillmentDate ?? reservation.createdAt,
    displayTime: nextOccurrence?.occurrenceTime ?? reservation.fulfillmentTime,
    displayLocation: nextOccurrence?.occurrenceLocation ?? reservation.fulfillmentLocation,
    nextOccurrence: nextOccurrence ? {
      id: nextOccurrence.id,
      occurrenceDate: nextOccurrence.occurrenceDate,
      occurrenceTime: nextOccurrence.occurrenceTime,
      occurrenceLocation: nextOccurrence.occurrenceLocation,
      status: nextOccurrence.status
    } : null,
    occurrences: [],
    notifications: [],
    pickupPoint: reservation.pickupPoint ? { id: reservation.pickupPoint.id, name: reservation.pickupPoint.name, address: reservation.pickupPoint.address } : null,
    deliveryTour: reservation.deliveryTour ? {
      id: reservation.deliveryTour.id,
      name: reservation.deliveryTour.name,
      dayOfWeek: reservation.deliveryTour.dayOfWeek,
      startTime: reservation.deliveryTour.startTime,
      endTime: reservation.deliveryTour.endTime,
      monthlyPrice: reservation.deliveryTour.monthlyPrice ? Number(reservation.deliveryTour.monthlyPrice) : null,
      cities: reservation.deliveryTour.cities?.map((city: any) => city.city) ?? []
    } : null
  }
}

function parseStatuses(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED']
  }

  return value
    .split(',')
    .map((status) => status.trim().toUpperCase())
    .filter(Boolean)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const subscriptionsEnabled = await isSubscriptionsEnabled()

  const query = getQuery(event)
  const mode = query.mode === 'calendar' ? 'calendar' : 'list'
  const statuses = parseStatuses(query.statuses)
  const includeArchived = statuses.includes('ARCHIVED')
  const baseStatuses = statuses.filter((status) => status !== 'ARCHIVED')
  const today = getDayStart(new Date())

  const include = {
    basket: true,
    pickupPoint: true,
    deliveryTour: { include: { cities: true } },
    scheduleProposals: {
      orderBy: { createdAt: 'asc' as const }
    },
    occurrences: {
      orderBy: { occurrenceDate: 'asc' as const }
    }
  } satisfies DbTypes.ReservationInclude

  const reservations = await db.reservation.findMany({
    where: includeArchived && baseStatuses.length
      ? {
          OR: [
            { archivedAt: { not: null } },
            { archivedAt: null, status: { in: baseStatuses as any[] } }
          ]
        }
      : includeArchived
        ? { archivedAt: { not: null } }
        : {
            archivedAt: null,
            status: { in: baseStatuses as any[] }
          },
    orderBy: [{ createdAt: 'desc' }],
    include
  })

  if (subscriptionsEnabled) {
    await Promise.all(
      reservations
        .filter((reservation: any) => reservation.status === 'CONFIRMED' && reservation.fulfillmentDate)
        .map((reservation: any) => ensureReservationOccurrences(reservation, subscriptionsEnabled))
    )
  }

  const hydratedReservations = await db.reservation.findMany({
    where: { id: { in: reservations.map((reservation: any) => reservation.id) } },
    include
  })

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

    const calendarItems = hydratedReservations.flatMap((reservation: any) => {
      const occurrencesInRange = subscriptionsEnabled ? (reservation.occurrences ?? [])
        .filter((occurrence: any) => {
          const date = new Date(occurrence.occurrenceDate)
          return date >= gridStart && date <= gridEnd
        })
        .map((occurrence: any) => ({
          id: `occurrence-${occurrence.id}`,
          reservationId: reservation.id,
          occurrenceId: occurrence.id,
          customerName: reservation.customerName,
          status: occurrence.status === 'CANCELLED' ? 'CANCELLED' : reservation.status,
          basket: { id: reservation.basket.id, name: reservation.basket.name, finalPrice: Number(reservation.basket.finalPrice) },
          date: occurrence.occurrenceDate,
          time: occurrence.occurrenceTime ?? reservation.fulfillmentTime,
          location: occurrence.occurrenceLocation ?? reservation.fulfillmentLocation
        }))
        : []

      if (occurrencesInRange.length) return occurrencesInRange

      const source = reservation.fulfillmentDate ?? reservation.createdAt
      const sourceDate = new Date(source)
      if (sourceDate < gridStart || sourceDate > gridEnd) return []

      return [{
        id: `reservation-${reservation.id}`,
        reservationId: reservation.id,
        occurrenceId: null,
        customerName: reservation.customerName,
        status: reservation.status,
        basket: { id: reservation.basket.id, name: reservation.basket.name, finalPrice: Number(reservation.basket.finalPrice) },
        date: source,
        time: reservation.fulfillmentTime,
        location: reservation.fulfillmentLocation
      }]
    })

    const perPage = toPositiveInt(query.perDayLimit, 4, 30)
    const dayPages = parseDayPages(query.dayPages)
    const days = []

    for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
      const date = new Date(cursor)
      const iso = date.toISOString().slice(0, 10)
      const dayItems = calendarItems.filter((item: any) => sameDay(new Date(item.date), date))
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

  const filtered = hydratedReservations
    .filter((reservation: any) => getReservationDisplayDate(reservation, today, subscriptionsEnabled) >= today)
    .sort((a: any, b: any) => getReservationDisplayDate(a, today, subscriptionsEnabled).getTime() - getReservationDisplayDate(b, today, subscriptionsEnabled).getTime())
    .map((reservation: any) => serializeReservation(reservation, today, subscriptionsEnabled))

  const page = toPositiveInt(query.page, 1)
  const perPage = toPositiveInt(query.limit, 10, 50)
  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return {
    mode,
    items: filtered.slice((page - 1) * perPage, page * perPage),
    pagination: { page, perPage, total, totalPages }
  }
})
