import type { DeliveryTour, PickupPoint, Reservation, Basket } from '@prisma/client'
import { prisma } from '../../prisma/client'
import {
  buildGoogleCalendarEventPayload,
  deleteGoogleCalendarEvent,
  listGoogleCalendarEventInstances,
  patchGoogleCalendarEvent,
  upsertGoogleCalendarEvent
} from './gmail'
import { getSetting, SETTING_KEYS } from './settings'

type ReservationForSync = Reservation & {
  basket: Basket
  pickupPoint: PickupPoint | null
  deliveryTour: DeliveryTour | null
}

type ReservationOccurrenceForSync = {
  id: number
  occurrenceDate: Date
  originalOccurrenceDate?: Date | null
  occurrenceTime: string | null
  occurrenceLocation: string | null
}

function sameOccurrenceDay(value: string | undefined, expected: Date) {
  if (!value) return false
  return value.slice(0, 10) === expected.toISOString().slice(0, 10)
}

async function findGoogleCalendarOccurrenceInstance(
  calendarId: string,
  recurringEventId: string,
  occurrence: ReservationOccurrenceForSync
) {
  const instances = await listGoogleCalendarEventInstances(calendarId, recurringEventId)
  const originalDate = occurrence.originalOccurrenceDate ?? occurrence.occurrenceDate

  return instances.find((instance) =>
    sameOccurrenceDay(instance.originalStartTime?.dateTime, originalDate)
    || sameOccurrenceDay(instance.originalStartTime?.date, originalDate)
    || sameOccurrenceDay(instance.start?.dateTime, originalDate)
    || sameOccurrenceDay(instance.start?.date, originalDate)
  ) ?? null
}

export function getReservationCalendarSyncState(reservation: Reservation) {
  if (reservation.status !== 'CONFIRMED') {
    return { canSync: false as const, reason: 'Seules les reservations confirmées peuvent être synchronisées.' }
  }
  if (!reservation.fulfillmentDate) {
    return { canSync: false as const, reason: 'Ajoutez une date de retrait ou livraison avant de synchroniser.' }
  }

  return { canSync: true as const, reason: null }
}

export async function syncReservationToGoogleCalendar(reservation: ReservationForSync, subscriptionsEnabled: boolean) {
  const calendarId = await getSetting(SETTING_KEYS.GOOGLE_CALENDAR_ID)
  if (!calendarId) {
    return { synced: false as const, eventId: null, reason: 'Aucun calendrier Google n\'est sélectionné dans les paramètres.' }
  }

  const syncState = getReservationCalendarSyncState(reservation)
  if (!syncState.canSync) {
    return { synced: false as const, eventId: null, reason: syncState.reason }
  }

  const event = await upsertGoogleCalendarEvent(
    calendarId,
    {
      reservationId: reservation.id,
      customerName: reservation.customerName,
      email: reservation.email,
      phone: reservation.phone,
      message: reservation.message,
      basketName: reservation.basket.name,
      basketPrice: Number(reservation.basket.finalPrice),
      deliveryType: reservation.deliveryType,
      deliveryAddress: reservation.deliveryAddress,
      deliveryCity: reservation.deliveryCity,
      deliveryPostalCode: reservation.deliveryPostalCode,
      fulfillmentDate: reservation.fulfillmentDate,
      fulfillmentTime: reservation.fulfillmentTime,
      fulfillmentLocation: reservation.fulfillmentLocation,
      pickupPoint: reservation.pickupPoint
        ? { name: reservation.pickupPoint.name, address: reservation.pickupPoint.address }
        : null,
      deliveryTour: reservation.deliveryTour
        ? {
          name: reservation.deliveryTour.name,
          startTime: reservation.deliveryTour.startTime,
          endTime: reservation.deliveryTour.endTime
        }
        : null,
      monthlySubscription: reservation.monthlySubscription,
      subscriptionsEnabled
    },
    reservation.googleCalendarEventId
  )

  if (!event?.id) {
    return {
      synced: false as const, eventId: null, reason: "Google Calendar n'a pas accepté l'événement."
    }
  }

  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      googleCalendarEventId: event.id,
      googleCalendarSyncedAt: new Date()
    }
  })

  return { synced: true as const, eventId: event.id, reason: null }
}

export async function removeReservationFromGoogleCalendar(reservation: Reservation) {
  const calendarId = await getSetting(SETTING_KEYS.GOOGLE_CALENDAR_ID)
  if (!calendarId || !reservation.googleCalendarEventId) {
    return { removed: false as const }
  }

  const deletion = await deleteGoogleCalendarEvent(calendarId, reservation.googleCalendarEventId)
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      googleCalendarEventId: null,
      googleCalendarSyncedAt: null
    }
  })

  return { removed: true as const, alreadyDeleted: deletion.alreadyDeleted }
}

export async function syncReservationOccurrenceToGoogleCalendar(
  reservation: ReservationForSync,
  occurrence: ReservationOccurrenceForSync,
  subscriptionsEnabled = false
) {
  const calendarId = await getSetting(SETTING_KEYS.GOOGLE_CALENDAR_ID)
  if (!calendarId || !reservation.googleCalendarEventId) {
    return { synced: false as const, reason: 'Aucun evenement Google Calendar parent a mettre a jour.' }
  }

  const instance = await findGoogleCalendarOccurrenceInstance(calendarId, reservation.googleCalendarEventId, occurrence)
  if (!instance?.id) {
    return { synced: false as const, reason: 'Occurrence Google Calendar introuvable.' }
  }

  const payload = buildGoogleCalendarEventPayload({
    reservationId: reservation.id,
    customerName: reservation.customerName,
    email: reservation.email,
    phone: reservation.phone,
    message: reservation.message,
    basketName: reservation.basket.name,
    basketPrice: Number(reservation.basket.finalPrice),
    deliveryType: reservation.deliveryType,
    deliveryAddress: reservation.deliveryAddress,
    deliveryCity: reservation.deliveryCity,
    deliveryPostalCode: reservation.deliveryPostalCode,
    fulfillmentDate: occurrence.occurrenceDate,
    fulfillmentTime: occurrence.occurrenceTime,
    fulfillmentLocation: occurrence.occurrenceLocation,
    pickupPoint: reservation.pickupPoint
      ? { name: reservation.pickupPoint.name, address: reservation.pickupPoint.address }
      : null,
    deliveryTour: reservation.deliveryTour
      ? {
        name: reservation.deliveryTour.name,
        startTime: reservation.deliveryTour.startTime,
        endTime: reservation.deliveryTour.endTime
      }
      : null,
    monthlySubscription: false,
    subscriptionsEnabled
  })

  if (!payload) {
    return { synced: false as const, reason: 'Impossible de calculer les horaires Google Calendar.' }
  }

  await patchGoogleCalendarEvent(calendarId, instance.id, payload, 'none')
  await prisma.reservationOccurrence.update({
    where: { id: occurrence.id },
    data: { googleCalendarEventId: instance.id }
  })

  return { synced: true as const, reason: null }
}

export async function cancelReservationOccurrenceInGoogleCalendar(
  reservation: ReservationForSync,
  occurrence: ReservationOccurrenceForSync
) {
  const calendarId = await getSetting(SETTING_KEYS.GOOGLE_CALENDAR_ID)
  if (!calendarId || !reservation.googleCalendarEventId) {
    return { removed: false as const, reason: 'Aucun evenement Google Calendar parent a annuler.' }
  }

  const instance = await findGoogleCalendarOccurrenceInstance(calendarId, reservation.googleCalendarEventId, occurrence)
  if (!instance?.id) {
    return { removed: false as const, reason: 'Occurrence Google Calendar introuvable.' }
  }

  await patchGoogleCalendarEvent(calendarId, instance.id, { status: 'cancelled' }, 'none')
  await prisma.reservationOccurrence.update({
    where: { id: occurrence.id },
    data: { googleCalendarEventId: instance.id }
  })

  return { removed: true as const, reason: null }
}
