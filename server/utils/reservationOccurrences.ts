import type { Reservation, ReservationOccurrence } from '@prisma/client'
import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'
import { prisma } from '../../prisma/client'

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
  reservation: Pick<Reservation, 'id' | 'monthlySubscription' | 'fulfillmentDate' | 'fulfillmentTime' | 'fulfillmentLocation' | 'status' | 'subscriptionActive'>
) {
  if (reservation.status !== 'CONFIRMED' || !reservation.fulfillmentDate) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const desiredDates = SUBSCRIPTIONS_ENABLED && reservation.monthlySubscription && reservation.subscriptionActive
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

  const existing = await prisma.reservationOccurrence.findMany({
    where: { reservationId: reservation.id },
    orderBy: { occurrenceDate: 'asc' }
  })

  const byDate = new Map(
    existing.map((occurrence) => [
      (occurrence.originalOccurrenceDate ?? occurrence.occurrenceDate).toISOString().slice(0, 10),
      occurrence
    ])
  )
  const created: ReservationOccurrence[] = []

  for (const desiredDate of desiredDates) {
    const key = desiredDate.toISOString().slice(0, 10)
    const existingOccurrence = byDate.get(key)
    if (existingOccurrence) {
      if (
        existingOccurrence.status === 'CANCELLED' &&
        REACTIVATABLE_CANCELLATION_REASONS.has(existingOccurrence.cancellationReason ?? '')
      ) {
        await prisma.reservationOccurrence.update({
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

  if (!SUBSCRIPTIONS_ENABLED || !reservation.monthlySubscription || !reservation.subscriptionActive) {
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
