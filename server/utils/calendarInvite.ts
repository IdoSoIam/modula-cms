import type { DeliveryTour, PickupPoint, Reservation, Basket } from '#modula/server/data/types'

type ReservationWithRelations = Reservation & {
  basket: Basket
  pickupPoint: PickupPoint | null
  deliveryTour: DeliveryTour | null
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function toIcsTimestamp(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

function toIcsDate(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

function foldIcsLine(line: string) {
  const maxLength = 73
  if (line.length <= maxLength) return line

  const chunks: string[] = []
  let remaining = line
  while (remaining.length > maxLength) {
    chunks.push(remaining.slice(0, maxLength))
    remaining = ` ${remaining.slice(maxLength)}`
  }
  chunks.push(remaining)
  return chunks.join('\r\n')
}

function parseTime(value: string | null | undefined) {
  if (!value) return null
  const match = value.trim().match(/^(\d{1,2})(?:[:hH](\d{1,2}))?/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2] ?? 0)
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

function resolveStartEnd(reservation: ReservationWithRelations) {
  if (!reservation.fulfillmentDate) return null

  const base = new Date(reservation.fulfillmentDate)
  const startTime = parseTime(reservation.fulfillmentTime) ?? parseTime(reservation.deliveryTour?.startTime)
  const endTime = parseTime(reservation.deliveryTour?.endTime)

  const start = new Date(base)
  start.setHours(startTime?.hour ?? 9, startTime?.minute ?? 0, 0, 0)

  const end = new Date(base)
  end.setHours(endTime?.hour ?? start.getHours() + 1, endTime?.minute ?? start.getMinutes(), 0, 0)

  if (end <= start) {
    end.setTime(start.getTime() + 60 * 60 * 1000)
  }

  return { start, end }
}

function getExclusiveAllDayEnd(date: Date) {
  const end = new Date(date)
  end.setDate(end.getDate() + 1)
  return end
}

function getIcsSequence(date: Date | null | undefined, fallback = 0) {
  if (!date) return fallback
  return Math.max(fallback, Math.floor(date.getTime() / 1000))
}

function buildLocation(reservation: ReservationWithRelations) {
  if (reservation.fulfillmentLocation) return reservation.fulfillmentLocation
  if (reservation.pickupPoint?.address) return reservation.pickupPoint.address
  const cityLine = [reservation.deliveryPostalCode, reservation.deliveryCity].filter(Boolean).join(' ')
  return [reservation.deliveryAddress, cityLine].filter(Boolean).join(', ') || ''
}

export function buildReservationIcs(options: {
  reservation: ReservationWithRelations
  method: 'REQUEST' | 'CANCEL'
  organizerEmail: string
  organizerName?: string
  sequence?: number
  manageUrl?: string | null
  recurrenceId?: Date | null
  recurrenceIdTime?: string | null
  occurrenceDate?: Date | null
  occurrenceTime?: string | null
  occurrenceLocation?: string | null
  singleOccurrence?: boolean
  updatedAt?: Date | null
  subscriptionsEnabled: boolean
}) {
  const occurrenceReservation = {
    ...options.reservation,
    fulfillmentDate: options.occurrenceDate ?? options.reservation.fulfillmentDate,
    fulfillmentTime: options.occurrenceTime ?? options.reservation.fulfillmentTime,
    fulfillmentLocation: options.occurrenceLocation ?? options.reservation.fulfillmentLocation,
    monthlySubscription: options.singleOccurrence ? false : (options.subscriptionsEnabled ? options.reservation.monthlySubscription : false)
  }

  const resolved = resolveStartEnd(occurrenceReservation)
  if (!resolved) return null

  const recurrenceReservation = options.recurrenceId
    ? {
        ...options.reservation,
        fulfillmentDate: options.recurrenceId,
        fulfillmentTime: options.recurrenceIdTime ?? options.reservation.fulfillmentTime
      }
    : null
  const resolvedRecurrence = recurrenceReservation ? resolveStartEnd(recurrenceReservation) : null

  const uid = `reservation-${options.reservation.id}@ferme-campeyrigoux`
  const sequence = getIcsSequence(options.updatedAt ?? options.reservation.updatedAt, options.sequence ?? 0)
  const summary = `${options.reservation.basket.name} - ${options.reservation.customerName}`
  const description = [
    `Reservation #${options.reservation.id}`,
    `Client : ${options.reservation.customerName}`,
    `Email : ${options.reservation.email}`,
    `Telephone : ${options.reservation.phone ?? '-'}`,
    `Panier : ${options.reservation.basket.name}`,
    `Message : ${options.reservation.message ?? '-'}`
  ].join('\n')
  const isAllDay = !parseTime(occurrenceReservation.fulfillmentTime) && !parseTime(occurrenceReservation.deliveryTour?.startTime)
  const dtStartLine = isAllDay
    ? `DTSTART;VALUE=DATE:${toIcsDate(resolved.start)}`
    : `DTSTART:${toIcsTimestamp(resolved.start)}`
  const dtEndLine = isAllDay
    ? `DTEND;VALUE=DATE:${toIcsDate(getExclusiveAllDayEnd(resolved.start))}`
    : `DTEND:${toIcsTimestamp(resolved.end)}`
  const recurrenceIsAllDay = recurrenceReservation
    ? !parseTime(recurrenceReservation.fulfillmentTime) && !parseTime(recurrenceReservation.deliveryTour?.startTime)
    : isAllDay
  const recurrenceIdLine = options.recurrenceId && options.singleOccurrence && resolvedRecurrence
    ? recurrenceIsAllDay
      ? `RECURRENCE-ID;VALUE=DATE:${toIcsDate(resolvedRecurrence.start)}`
      : `RECURRENCE-ID:${toIcsTimestamp(resolvedRecurrence.start)}`
    : null

  const lines = [
    'BEGIN:VCALENDAR',
    'PRODID:-//Ferme du Campeyrigoux//Reservations//FR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    `METHOD:${options.method}`,
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toIcsTimestamp(new Date())}`,
    dtStartLine,
    dtEndLine,
    ...(recurrenceIdLine ? [recurrenceIdLine] : []),
    `SUMMARY:${escapeIcs(summary)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    `LOCATION:${escapeIcs(buildLocation(occurrenceReservation))}`,
    `STATUS:${options.method === 'CANCEL' ? 'CANCELLED' : 'CONFIRMED'}`,
    'CLASS:PUBLIC',
    `TRANSP:${options.method === 'CANCEL' ? 'TRANSPARENT' : 'OPAQUE'}`,
    `SEQUENCE:${sequence}`,
    ...(options.subscriptionsEnabled && options.reservation.monthlySubscription && !options.singleOccurrence ? ['RRULE:FREQ=WEEKLY;INTERVAL=1'] : []),
    ...(options.manageUrl ? [`URL:${escapeIcs(options.manageUrl)}`] : []),
    `ORGANIZER;CN=${escapeIcs(options.organizerName ?? 'Ferme du Campeyrigoux')}:mailto:${options.organizerEmail}`,
    `ATTENDEE;CN=${escapeIcs(options.reservation.customerName)};CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${options.reservation.email}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ]

  return {
    filename: `reservation-${options.reservation.id}.ics`,
    mimeType: `text/calendar; charset="UTF-8"; method=${options.method}; component=VEVENT`,
    content: lines.map(foldIcsLine).join('\r\n')
  }
}
