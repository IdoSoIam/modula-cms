import type { Reservation, ReservationOccurrence } from '#modula/server/data/types'
import { db } from '#modula/server/data/client'

const DEFAULT_WEEKS_AHEAD = 52
const REACTIVATABLE_CANCELLATION_REASONS = new Set([
  'Reservation annulee',
  'Reservation refusee',
  'Reservation annulee par le client',
  'Abonnement arrete par le client',
  'Occurrence fermee car la reservation n est plus recurrente'
])

function addWeeks(date: Date, weeks: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + weeks * 7)
  return next
}

export async function ensureReservationOccurrences(
  reservation: Pick<Reservation, 'id' | 'monthlySubscription' | 'fulfillmentDate' | 'fulfillmentTime' | 'fulfillmentLocation' | 'status' | 'subscriptionActive'>,
  subscriptionsEnabled: boolean
) {
  if (reservation.status !== 'CONFIRMED' || !reservation.fulfillmentDate) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const desiredDates = subscriptionsEnabled && reservation.monthlySubscription && reservation.subscriptionActive
    ? (() => {
        const dates: Date[] = []
        let cursor = new Date(reservation.fulfillmentDate!)
        while (cursor < today) {
          cursor = addWeeks(cursor, 1)
        }

        for (let index = 0; index < DEFAULT_WEEKS_AHEAD; index++) {
          dates.push(addWeeks(cursor, index))
        }
        return dates
      })()
    : [new Date(reservation.fulfillmentDate)]

  const existing = await db.reservationOccurrence.findMany({
    where: { reservationId: reservation.id },
    orderBy: { occurrenceDate: 'asc' }
  })

  const byDate = new Map(
    existing.map((occurrence: any) => [
      (occurrence.originalOccurrenceDate ?? occurrence.occurrenceDate).toISOString().slice(0, 10),
      occurrence
    ])
  )
  const created: ReservationOccurrence[] = []

  for (const desiredDate of desiredDates) {
    const key = desiredDate.toISOString().slice(0, 10)
    const existingOccurrence: any = byDate.get(key)
    if (existingOccurrence) {
      if (
        existingOccurrence.status === 'CANCELLED' &&
        REACTIVATABLE_CANCELLATION_REASONS.has(existingOccurrence.cancellationReason ?? '')
      ) {
        await db.reservationOccurrence.update({
          where: { id: existingOccurrence.id },
          data: {
            status: 'SCHEDULED',
            cancelledAt: null,
            cancellationReason: null,
            occurrenceTime: existingOccurrence.customSchedule ? existingOccurrence.occurrenceTime : reservation.fulfillmentTime,
            occurrenceLocation: existingOccurrence.customSchedule ? existingOccurrence.occurrenceLocation : reservation.fulfillmentLocation
          }
        })
      }
      continue
    }

    const occurrence = await db.reservationOccurrence.create({
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

  if (!subscriptionsEnabled || !reservation.monthlySubscription || !reservation.subscriptionActive) {
    await db.reservationOccurrence.updateMany({
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

  await db.reservationOccurrence.updateMany({
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
