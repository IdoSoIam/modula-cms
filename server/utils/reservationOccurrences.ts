import type { Reservation, ReservationOccurrence } from '@prisma/client'
import { prisma } from '../../prisma/client'

const DEFAULT_WEEKS_AHEAD = 8

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + weeks * 7)
  return next
}

export async function ensureReservationOccurrences(
  reservation: Pick<Reservation, 'id' | 'monthlySubscription' | 'fulfillmentDate' | 'fulfillmentTime' | 'fulfillmentLocation' | 'status' | 'subscriptionActive'>
) {
  if (reservation.status !== 'CONFIRMED' || !reservation.fulfillmentDate) return []

  const desiredDates = reservation.monthlySubscription && reservation.subscriptionActive
    ? Array.from({ length: DEFAULT_WEEKS_AHEAD }, (_, index) => addWeeks(new Date(reservation.fulfillmentDate!), index))
    : [new Date(reservation.fulfillmentDate)]

  const existing = await prisma.reservationOccurrence.findMany({
    where: { reservationId: reservation.id },
    orderBy: { occurrenceDate: 'asc' }
  })

  const byDate = new Map(existing.map((occurrence) => [occurrence.occurrenceDate.toISOString().slice(0, 10), occurrence]))
  const created: ReservationOccurrence[] = []

  for (const desiredDate of desiredDates) {
    const key = desiredDate.toISOString().slice(0, 10)
    if (byDate.has(key)) continue

    const occurrence = await prisma.reservationOccurrence.create({
      data: {
        reservationId: reservation.id,
        occurrenceDate: desiredDate,
        originalOccurrenceDate: desiredDate,
        occurrenceTime: reservation.fulfillmentTime,
        occurrenceLocation: reservation.fulfillmentLocation
      }
    })
    created.push(occurrence)
  }

  if (!reservation.monthlySubscription || !reservation.subscriptionActive) {
    await prisma.reservationOccurrence.updateMany({
      where: {
        reservationId: reservation.id,
        occurrenceDate: { gt: new Date(reservation.fulfillmentDate) },
        status: 'SCHEDULED'
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: 'Occurrence fermee car la reservation n est plus recurrente'
      }
    })
  }

  return existing.concat(created)
}

export async function updateFutureOccurrencesFromReservation(
  reservation: Pick<Reservation, 'id' | 'fulfillmentDate' | 'fulfillmentTime' | 'fulfillmentLocation'>
) {
  if (!reservation.fulfillmentDate) return

  await prisma.reservationOccurrence.updateMany({
    where: {
      reservationId: reservation.id,
      status: 'SCHEDULED',
      customSchedule: false,
      occurrenceDate: { gte: new Date(reservation.fulfillmentDate) }
    },
    data: {
      occurrenceTime: reservation.fulfillmentTime,
      occurrenceLocation: reservation.fulfillmentLocation
    }
  })
}
