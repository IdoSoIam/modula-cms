import { db } from '#modula/server/data/client'

export type RentalSourceKind = 'product' | 'productLot'

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
}

export type RentalWindow = {
  rentalStartDate: string
  rentalEndDate: string
  startAt: Date
  endAt: Date
  durationDays: number
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
): RentalWindow | null {
  if (!rentalStartDate && !rentalEndDate) return null
  if (!rentalStartDate || !rentalEndDate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Les dates de début et de fin de location sont requises',
    })
  }

  const startAt = startOfDay(new Date(rentalStartDate))
  const endAt = endOfDay(new Date(rentalEndDate))
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

  const durationDays = Math.floor((startOfDay(endAt).getTime() - startOfDay(startAt).getTime()) / 86400000) + 1

  return {
    rentalStartDate: toIsoDate(startAt),
    rentalEndDate: toIsoDate(endAt),
    startAt,
    endAt,
    durationDays,
  }
}

export async function ensureRentalAvailability(
  requests: Array<RentalSource & { rentalWindow: RentalWindow | null }>,
) {
  if (!requests.length) return

  for (const request of requests) {
    if (!request.rentalWindow) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Veuillez sélectionner un créneau de location',
      })
    }
    validateRentalWindowAgainstSource(request, request.rentalWindow)
  }

  const grouped = groupRequestsBySource(requests)
  for (const request of grouped) {
    const rangeStart = request.requests.reduce(
      (current, entry) => entry.rentalWindow.startAt.getTime() < current.getTime() ? entry.rentalWindow.startAt : current,
      request.requests[0].rentalWindow.startAt,
    )
    const rangeEnd = request.requests.reduce(
      (current, entry) => entry.rentalWindow.endAt.getTime() > current.getTime() ? entry.rentalWindow.endAt : current,
      request.requests[0].rentalWindow.endAt,
    )
    const dayAvailability = await computeAvailabilityForSource(
      request.source,
      rangeStart,
      rangeEnd,
    )
    const availabilityByDay = new Map(dayAvailability.map((day) => [day.iso, day]))
    const requestedByDay = new Map<string, number>()

    for (const entry of request.requests) {
      for (const day of eachDayBetween(entry.rentalWindow.startAt, entry.rentalWindow.endAt)) {
        const iso = toIsoDate(day)
        requestedByDay.set(iso, (requestedByDay.get(iso) || 0) + entry.quantity)
      }
    }

    for (const [iso, requestedQuantity] of requestedByDay.entries()) {
      const availability = availabilityByDay.get(iso)
      if (!availability || !availability.selectable || requestedQuantity > availability.remaining) {
        throw createError({
          statusCode: 409,
          statusMessage: `Le créneau demandé n’est plus disponible pour ${request.source.title}`,
        })
      }
    }
  }
}

export async function computeAvailabilityForSource(
  source: Omit<RentalSource, 'quantity'> & { quantity?: number },
  startAt: Date,
  endAt: Date,
): Promise<RentalAvailabilityDay[]> {
  const rangeStart = startOfDay(startAt)
  const rangeEnd = endOfDay(endAt)
  const overlappingOrders = await db.shopOrder.findMany({
    where: {
      status: { in: ['PENDING', 'PAID'] },
    },
    select: { id: true },
  })

  const orderIds = overlappingOrders.map((entry: any) => Number(entry.id))
  const overlappingLines = orderIds.length
    ? await db.shopOrderLine.findMany({
        where: {
          orderId: { in: orderIds },
          ...(source.kind === 'product'
            ? { productId: source.id }
            : { productLotId: source.id }),
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
  const availableFrom = source.rentalAvailableFrom ? startOfDay(new Date(source.rentalAvailableFrom)) : null
  const availableTo = source.rentalAvailableTo ? endOfDay(new Date(source.rentalAvailableTo)) : null
  if (availableFrom && value.getTime() < availableFrom.getTime()) return false
  if (availableTo && value.getTime() > availableTo.getTime()) return false
  return true
}

function validateRentalWindowAgainstSource(source: RentalSource, rentalWindow: RentalWindow) {
  if (source.stock <= 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `${source.title} n’est actuellement pas disponible à la location`,
    })
  }

  const availableFrom = source.rentalAvailableFrom ? startOfDay(new Date(source.rentalAvailableFrom)) : null
  const availableTo = source.rentalAvailableTo ? endOfDay(new Date(source.rentalAvailableTo)) : null
  if (availableFrom && rentalWindow.startAt.getTime() < availableFrom.getTime()) {
    throw createError({
      statusCode: 400,
      statusMessage: `${source.title} n’est pas disponible à cette date de début`,
    })
  }
  if (availableTo && rentalWindow.endAt.getTime() > availableTo.getTime()) {
    throw createError({
      statusCode: 400,
      statusMessage: `${source.title} n’est pas disponible à cette date de fin`,
    })
  }

  const minDays = Math.max(1, Number(source.rentalMinDays || 1))
  if (rentalWindow.durationDays < minDays) {
    throw createError({
      statusCode: 400,
      statusMessage: `${source.title} nécessite une location minimale de ${minDays} jour(s)`,
    })
  }

  const maxDays = source.rentalMaxDays == null ? null : Math.max(1, Number(source.rentalMaxDays))
  if (maxDays != null && rentalWindow.durationDays > maxDays) {
    throw createError({
      statusCode: 400,
      statusMessage: `${source.title} dépasse la durée maximale autorisée de ${maxDays} jour(s)`,
    })
  }
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
