import { db } from '#modula/server/data/client'
import { getRentalCalendarConfig } from '#modula/server/utils/settings'
import { getRentalOpeningRanges } from '#modula/shared/rentalCalendar'

export type RentalSourceKind = 'product'

export type RentalSource = {
  kind: RentalSourceKind
  id: number
  title: string
  quantity: number
  stock: number
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  rentalBookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
  rentalDurations: number[]
  rentalSlotStepMinutes: number
  rentalPricingMode?: 'HOURLY' | 'DAILY' | null
}

export type RentalWindow = {
  rentalStartDate: string
  rentalEndDate: string
  startAt: Date
  endAt: Date
  durationDays: number
  timezone: string
}

export type RentalAvailabilityDay = {
  iso: string
  remaining: number
  reserved: number
  stock: number
  status: 'available' | 'partial' | 'full' | 'outside'
  selectable: boolean
}

export function resolveRentalWindow(
  rentalStartDate: string | null | undefined,
  rentalEndDate: string | null | undefined,
  timezone = 'Europe/Paris',
): RentalWindow | null {
  if (!rentalStartDate && !rentalEndDate) return null
  if (!rentalStartDate || !rentalEndDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Les dates de début et de fin de location sont requises',
    })
  }

  const hasTime = rentalStartDate.includes('T') || rentalEndDate.includes('T')
  const startAt = hasTime ? parseRentalDateTime(rentalStartDate, timezone) : startOfDay(new Date(rentalStartDate))
  const endAt = hasTime ? parseRentalDateTime(rentalEndDate, timezone) : endOfDay(new Date(rentalEndDate))
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dates de location invalides',
    })
  }

  if (endAt.getTime() < startAt.getTime()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La fin de location doit être postérieure ou égale au début',
    })
  }

  const startDay = zonedIsoDate(startAt, timezone)
  const endDay = zonedIsoDate(endAt, timezone)
  const durationDays = Math.floor((Date.parse(endDay) - Date.parse(startDay)) / 86400000) + 1

  return {
    rentalStartDate: hasTime ? startAt.toISOString() : toIsoDate(startAt),
    rentalEndDate: hasTime ? endAt.toISOString() : toIsoDate(endAt),
    startAt,
    endAt,
    durationDays,
    timezone,
  }
}

export async function ensureRentalAvailability(
  requests: Array<RentalSource & { rentalWindow: RentalWindow | null }>,
  options?: {
    excludedOrderIds?: number[]
    message?: (key: string, params: Record<string, string | number>) => string
  },
) {
  if (!requests.length) return

  for (const request of requests) {
    if (!request.rentalWindow) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Veuillez sélectionner un créneau de location',
      })
    }
    validateRentalWindowAgainstSource(request, request.rentalWindow, options?.message)
  }

  const calendar = await getRentalCalendarConfig()
  for (const request of requests) validateRentalWindowAgainstCalendar(request, request.rentalWindow!, calendar, options?.message)

  const timedRequests = requests.filter(request => isHourlyRentalWindow(request.rentalBookingMode, request.rentalWindow!, request.rentalPricingMode))
  for (const request of timedRequests) {
    const reserved = await getReservedQuantityForWindow(request.id, request.rentalWindow!, options?.excludedOrderIds)
    if (reserved + request.quantity > request.stock) {
      throw createError({ statusCode: 409, message: rentalMessage(options?.message, 'shop.rentalErrors.slotUnavailable', 'Le créneau demandé n’est plus disponible pour {name}', { name: request.title }) })
    }
  }

  const grouped = groupRequestsBySource(requests.filter(request => !isHourlyRentalWindow(request.rentalBookingMode, request.rentalWindow!, request.rentalPricingMode)))
  for (const request of grouped) {
    const firstRequest = request.requests[0]
    if (!firstRequest) continue
    const rangeStart = request.requests.reduce(
      (current, entry) => entry.rentalWindow.startAt.getTime() < current.getTime() ? entry.rentalWindow.startAt : current,
      firstRequest.rentalWindow.startAt,
    )
    const rangeEnd = request.requests.reduce(
      (current, entry) => entry.rentalWindow.endAt.getTime() > current.getTime() ? entry.rentalWindow.endAt : current,
      firstRequest.rentalWindow.endAt,
    )
    const requestedByDay = new Map<string, number>()

    for (const entry of request.requests) {
      const startIso = zonedIsoDate(entry.rentalWindow.startAt, entry.rentalWindow.timezone)
      const endIso = zonedIsoDate(entry.rentalWindow.endAt, entry.rentalWindow.timezone)
      for (const iso of eachIsoDateBetween(startIso, endIso)) {
        requestedByDay.set(iso, (requestedByDay.get(iso) || 0) + entry.quantity)
      }
    }

    const reservationLines = await getReservationLinesForWindow(request.source.id, {
      rentalStartDate: rangeStart.toISOString(),
      rentalEndDate: rangeEnd.toISOString(),
      startAt: rangeStart,
      endAt: rangeEnd,
      durationDays: 1,
      timezone: firstRequest.rentalWindow.timezone,
    }, options?.excludedOrderIds)
    const reservedByDay = new Map<string, number>()
    for (const line of reservationLines) {
      const lineStart = zonedIsoDate(new Date(line.rentalStartDate), firstRequest.rentalWindow.timezone)
      const lineEnd = zonedIsoDate(new Date(line.rentalEndDate), firstRequest.rentalWindow.timezone)
      for (const iso of eachIsoDateBetween(lineStart, lineEnd)) {
        reservedByDay.set(iso, (reservedByDay.get(iso) || 0) + Number(line.quantity || 0))
      }
    }

    for (const [iso, requestedQuantity] of requestedByDay.entries()) {
      const reservedQuantity = reservedByDay.get(iso) || 0
      if (requestedQuantity + reservedQuantity > request.source.stock) {
        throw createError({
          statusCode: 409,
          message: rentalMessage(options?.message, 'shop.rentalErrors.slotUnavailable', 'Le créneau demandé n’est plus disponible pour {name}', { name: request.source.title }),
        })
      }
    }
  }
}

type RentalReservationLine = {
  quantity: number
  rentalStartDate: string
  rentalEndDate: string
}

export async function computeRentalSlots(
  source: RentalSource,
  isoDate: string,
  durationMinutes: number,
): Promise<Array<{ start: string, end: string, remaining: number }>> {
  if (!source.rentalDurations.includes(durationMinutes)) return []
  const calendar = await getRentalCalendarConfig()
  const ranges = getRentalOpeningRanges(calendar, isoDate)
  const slots: Array<{ start: string, end: string, remaining: number }> = []
  if (!ranges.length) return slots
  const dayStart = dateTimeFromParts(isoDate, ranges[0]!.start, calendar.timezone)
  const dayEnd = dateTimeFromParts(isoDate, ranges[ranges.length - 1]!.end, calendar.timezone)
  const reservations = await getReservationLinesForWindow(source.id, {
    rentalStartDate: dayStart.toISOString(), rentalEndDate: dayEnd.toISOString(),
    startAt: dayStart, endAt: dayEnd, durationDays: 1, timezone: calendar.timezone,
  })
  for (const range of ranges) {
    const rangeStart = dateTimeFromParts(isoDate, range.start, calendar.timezone)
    const rangeEnd = dateTimeFromParts(isoDate, range.end, calendar.timezone)
    for (let cursor = rangeStart.getTime(); cursor + durationMinutes * 60000 <= rangeEnd.getTime(); cursor += source.rentalSlotStepMinutes * 60000) {
      const window = resolveRentalWindow(new Date(cursor).toISOString(), new Date(cursor + durationMinutes * 60000).toISOString(), calendar.timezone)!
      const reserved = reservations
        .filter((line: RentalReservationLine) => new Date(line.rentalStartDate).getTime() < window.endAt.getTime() && new Date(line.rentalEndDate).getTime() > window.startAt.getTime())
        .reduce((sum: number, line: RentalReservationLine) => sum + Number(line.quantity || 0), 0)
      const remaining = Math.max(0, source.stock - reserved)
      if (remaining > 0) slots.push({ start: window.rentalStartDate, end: window.rentalEndDate, remaining })
    }
  }
  return slots
}

async function getReservedQuantityForWindow(productId: number, window: RentalWindow, excludedIds: number[] = []) {
  const lines = await getReservationLinesForWindow(productId, window, excludedIds)
  return lines.reduce((sum: number, line: any) => sum + Number(line.quantity || 0), 0)
}

async function getReservationLinesForWindow(productId: number, window: RentalWindow, excludedIds: number[] = []): Promise<RentalReservationLine[]> {
  const orders = await db.shopOrder.findMany({
    where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED'] } },
    select: { id: true },
  })
  const excluded = new Set(excludedIds.map(Number))
  const orderIds = orders.map((order: any) => Number(order.id)).filter((id: number) => !excluded.has(id))
  if (!orderIds.length) return []
  return await db.shopOrderLine.findMany({
    where: {
      orderId: { in: orderIds },
      productId,
      rentalStartDate: { lt: window.rentalEndDate },
      rentalEndDate: { gt: window.rentalStartDate },
    },
    select: { quantity: true, rentalStartDate: true, rentalEndDate: true },
  }) as RentalReservationLine[]
}

export async function computeAvailabilityForSource(
  source: Omit<RentalSource, 'quantity'> & { quantity?: number },
  startAt: Date,
  endAt: Date,
  options?: {
    excludedOrderIds?: number[]
  },
): Promise<RentalAvailabilityDay[]> {
  const rangeStart = startOfDay(startAt)
  const rangeEnd = endOfDay(endAt)
  const overlappingOrders = await db.shopOrder.findMany({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED'] },
    },
    select: { id: true },
  })

  const excludedOrderIds = new Set(
    (options?.excludedOrderIds ?? [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value > 0),
  )
  const orderIds = overlappingOrders
    .map((entry: any) => Number(entry.id))
    .filter((id: number) => !excludedOrderIds.has(id))
  const overlappingLines = orderIds.length
    ? await db.shopOrderLine.findMany({
        where: {
          orderId: { in: orderIds },
          productId: source.id,
          rentalStartDate: { lte: toIsoDate(rangeEnd) },
          rentalEndDate: { gte: toIsoDate(rangeStart) },
        },
        select: {
          quantity: true,
          rentalStartDate: true,
          rentalEndDate: true,
        },
      })
    : []

  const reservedByDay = new Map<string, number>()
  for (const line of overlappingLines) {
    if (!line.rentalStartDate || !line.rentalEndDate) continue
    const lineStart = startOfDay(new Date(line.rentalStartDate))
    const lineEnd = endOfDay(new Date(line.rentalEndDate))
    for (const cursor of eachDayBetween(lineStart, lineEnd)) {
      const iso = toIsoDate(cursor)
      reservedByDay.set(iso, (reservedByDay.get(iso) || 0) + Number(line.quantity || 0))
    }
  }

  const days: RentalAvailabilityDay[] = []
  for (const cursor of eachDayBetween(rangeStart, rangeEnd)) {
    const iso = toIsoDate(cursor)
    const reserved = reservedByDay.get(iso) || 0
    const stock = Math.max(0, Number(source.stock || 0))
    const remaining = Math.max(0, stock - reserved)
    const outside = !isWithinSourceAvailability(source, cursor)
    days.push({
      iso,
      reserved,
      stock,
      remaining,
      selectable: !outside && remaining > 0,
      status: outside
        ? 'outside'
        : remaining <= 0
          ? 'full'
          : reserved > 0
            ? 'partial'
            : 'available',
    })
  }

  return days
}

function groupRequestsBySource(requests: Array<RentalSource & { rentalWindow: RentalWindow | null }>) {
  const grouped = new Map<string, {
    source: RentalSource
    requests: Array<RentalSource & { rentalWindow: RentalWindow }>
  }>()
  for (const request of requests) {
    if (!request.rentalWindow) continue
    const key = `${request.kind}:${request.id}`
    const existing = grouped.get(key)
    if (existing) {
      existing.requests.push({
        ...request,
        rentalWindow: request.rentalWindow,
      })
      continue
    }
    grouped.set(key, {
      source: {
        kind: request.kind,
        id: request.id,
        title: request.title,
        quantity: request.quantity,
        stock: request.stock,
        rentalAvailableFrom: request.rentalAvailableFrom,
        rentalAvailableTo: request.rentalAvailableTo,
        rentalMinDays: request.rentalMinDays,
        rentalMaxDays: request.rentalMaxDays,
        rentalBookingMode: request.rentalBookingMode,
        rentalDurations: request.rentalDurations,
        rentalSlotStepMinutes: request.rentalSlotStepMinutes,
        rentalPricingMode: request.rentalPricingMode,
      },
      requests: [{
        ...request,
        rentalWindow: request.rentalWindow,
      }],
    })
  }
  return [...grouped.values()]
}

function isWithinSourceAvailability(
  source: Pick<RentalSource, 'rentalAvailableFrom' | 'rentalAvailableTo'>,
  value: Date,
) {
  const availableFrom = source.rentalAvailableFrom?.slice(0, 10) || null
  const availableTo = source.rentalAvailableTo?.slice(0, 10) || null
  const valueDate = toIsoDate(value)
  if (availableFrom && valueDate < availableFrom) return false
  if (availableTo && valueDate > availableTo) return false
  return true
}

function validateRentalWindowAgainstSource(source: RentalSource, rentalWindow: RentalWindow, message?: (key: string, params: Record<string, string | number>) => string) {
  if (source.stock <= 0) {
    throw createError({
      statusCode: 409,
      message: rentalMessage(message, 'shop.rentalErrors.unavailable', '{name} n’est actuellement pas disponible à la location', { name: source.title }),
    })
  }

  const availableFrom = source.rentalAvailableFrom?.slice(0, 10) || null
  const availableTo = source.rentalAvailableTo?.slice(0, 10) || null
  const startDate = zonedIsoDate(rentalWindow.startAt, rentalWindow.timezone)
  const endDate = zonedIsoDate(rentalWindow.endAt, rentalWindow.timezone)
  if (availableFrom && startDate < availableFrom) {
    throw createError({
      statusCode: 400,
      message: rentalMessage(message, 'shop.rentalErrors.unavailableStart', '{name} n’est pas disponible à cette date de début', { name: source.title }),
    })
  }
  if (availableTo && endDate > availableTo) {
    throw createError({
      statusCode: 400,
      message: rentalMessage(message, 'shop.rentalErrors.unavailableEnd', '{name} n’est pas disponible à cette date de fin', { name: source.title }),
    })
  }

  if (isHourlyRentalWindow(source.rentalBookingMode, rentalWindow, source.rentalPricingMode)) {
    const durationMinutes = Math.round((rentalWindow.endAt.getTime() - rentalWindow.startAt.getTime()) / 60000)
    if (zonedIsoDate(rentalWindow.startAt, rentalWindow.timezone) !== zonedIsoDate(rentalWindow.endAt, rentalWindow.timezone) || !source.rentalDurations.includes(durationMinutes)) {
      throw createError({ statusCode: 400, message: `${source.title} ne propose pas cette durée de location` })
    }
    return
  }

  const minDays = Math.max(1, Number(source.rentalMinDays || 1))
  if (rentalWindow.durationDays < minDays) {
    throw createError({
      statusCode: 400,
      message: rentalMessage(message, 'shop.rentalErrors.minimumDays', '{name} nécessite une location minimale de {count} jour(s)', { name: source.title, count: minDays }),
    })
  }

  const maxDays = source.rentalMaxDays == null ? null : Math.max(1, Number(source.rentalMaxDays))
  if (maxDays != null && rentalWindow.durationDays > maxDays) {
    throw createError({
      statusCode: 400,
      message: rentalMessage(message, 'shop.rentalErrors.maximumDays', '{name} dépasse la durée maximale autorisée de {count} jour(s)', { name: source.title, count: maxDays }),
    })
  }
}

export function isHourlyRentalWindow(
  bookingMode: RentalSource['rentalBookingMode'],
  window: RentalWindow,
  pricingMode?: RentalSource['rentalPricingMode'],
) {
  if (bookingMode === 'SINGLE_DAY') return true
  if (bookingMode === 'MULTI_DAY') return false
  if (pricingMode) return pricingMode === 'HOURLY'
  return zonedIsoDate(window.startAt, window.timezone) === zonedIsoDate(window.endAt, window.timezone)
}

function validateRentalWindowAgainstCalendar(source: RentalSource, window: RentalWindow, calendar: Awaited<ReturnType<typeof getRentalCalendarConfig>>, message?: (key: string, params: Record<string, string | number>) => string) {
  const startRanges = getRentalOpeningRanges(calendar, zonedIsoDate(window.startAt, calendar.timezone))
  const endRanges = getRentalOpeningRanges(calendar, zonedIsoDate(window.endAt, calendar.timezone))
  if (!startRanges.length || !endRanges.length) {
    throw createError({ statusCode: 400, message: rentalMessage(message, 'shop.rentalErrors.closedDay', '{name} ne peut pas être retiré ou retourné un jour de fermeture', { name: source.title }) })
  }
  if (!includesTime(startRanges, window.startAt, calendar.timezone) || !includesTime(endRanges, window.endAt, calendar.timezone, true)) {
    throw createError({ statusCode: 400, message: rentalMessage(message, 'shop.rentalErrors.outsideHours', '{name} doit être retiré et retourné pendant les horaires d’ouverture', { name: source.title }) })
  }
}

function rentalMessage(
  resolver: ((key: string, params: Record<string, string | number>) => string) | undefined,
  key: string,
  fallback: string,
  params: Record<string, string | number>,
) {
  const template = resolver?.(key, params) || fallback
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, name) => String(params[name] ?? ''))
}

function includesTime(ranges: Array<{ start: string, end: string }>, value: Date, timezone: string, allowRangeEnd = false) {
  const parts = getZonedParts(value, timezone)
  const time = `${parts.hour}:${parts.minute}`
  return ranges.some(range => time >= range.start && (allowRangeEnd ? time <= range.end : time < range.end))
}

function dateTimeFromParts(isoDate: string, time: string, timezone: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const desired = Date.UTC(year!, month! - 1, day!, hour!, minute!)
  let candidate = new Date(desired)
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = getZonedParts(candidate, timezone)
    const represented = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute))
    candidate = new Date(candidate.getTime() + desired - represented)
  }
  return candidate
}

function parseRentalDateTime(value: string, timezone: string) {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return new Date(value)
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value)
  return match ? dateTimeFromParts(match[1]!, match[2]!, timezone) : new Date(value)
}

function getZonedParts(value: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value)
  return Object.fromEntries(parts.map(part => [part.type, part.value])) as Record<string, string>
}

function zonedIsoDate(value: Date, timezone: string) {
  const parts = getZonedParts(value, timezone)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

export function endOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(23, 59, 59, 999)
  return next
}

export function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

export function eachDayBetween(startAt: Date, endAt: Date) {
  const days: Date[] = []
  const cursor = startOfDay(startAt)
  const end = startOfDay(endAt)
  while (cursor.getTime() <= end.getTime()) {
    days.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function eachIsoDateBetween(startIso: string, endIso: string) {
  const days: string[] = []
  const cursor = new Date(`${startIso}T12:00:00.000Z`)
  const end = new Date(`${endIso}T12:00:00.000Z`)
  while (cursor.getTime() <= end.getTime()) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}
