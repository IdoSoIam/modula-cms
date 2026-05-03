import type { DeliveryTour, PickupPoint, Reservation, Basket } from '@prisma/client'
import { prisma } from '../../prisma/client'
import { deleteGoogleCalendarEvent, upsertGoogleCalendarEvent } from './gmail'
import { getSetting, SETTING_KEYS } from './settings'

type ReservationForSync = Reservation & {
  basket: Basket
  pickupPoint: PickupPoint | null
  deliveryTour: DeliveryTour | null
}

export function getReservationCalendarSyncState(reservation: Reservation) {
  if (reservation.status !== 'CONFIRMED') {
    return { canSync: false as const, reason: 'Seules les reservations confirmees peuvent etre synchronisees.' }
  }
  if (!reservation.fulfillmentDate) {
    return { canSync: false as const, reason: 'Ajoutez une date de retrait ou livraison avant de synchroniser.' }
  }

  return { canSync: true as const, reason: null }
}

export async function syncReservationToGoogleCalendar(reservation: ReservationForSync) {
  const calendarId = await getSetting(SETTING_KEYS.GOOGLE_CALENDAR_ID)
  if (!calendarId) {
    return { synced: false as const, eventId: null, reason: 'Aucun calendrier Google n est selectionne dans les parametres.' }
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
      monthlySubscription: reservation.monthlySubscription
    },
    reservation.googleCalendarEventId
  )

  if (!event?.id) {
    return { synced: false as const, eventId: null, reason: 'Google Calendar n a pas accepte l evenement.' }
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

  await deleteGoogleCalendarEvent(calendarId, reservation.googleCalendarEventId)
  await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      googleCalendarEventId: null,
      googleCalendarSyncedAt: null
    }
  })

  return { removed: true as const }
}
