import type { DeliveryTour, DeliveryType, PickupPoint, Reservation } from '@prisma/client'

interface FulfillmentInput {
  deliveryType: DeliveryType | null
  pickupPoint: Pick<PickupPoint, 'name' | 'address' | 'deliveryDay' | 'pickupStartTime'> | null
  deliveryTour: Pick<DeliveryTour, 'name' | 'dayOfWeek' | 'startTime' | 'endTime'> | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  fulfillmentDate?: Date | null
  fulfillmentTime?: string | null
  fulfillmentLocation?: string | null
}

export function getNextDateForDayOfWeek(dayOfWeek: number, fromDate = new Date()): Date {
  const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const diff = (dayOfWeek - base.getDay() + 7) % 7
  const result = new Date(base)
  result.setDate(base.getDate() + diff)
  if (result < fromDate) {
    result.setDate(result.getDate() + 7)
  }
  return result
}

function buildDefaultLocation(input: FulfillmentInput) {
  if (input.deliveryType === 'FARM') {
    return 'Retrait a la ferme du Campeyrigoux'
  }

  if (input.deliveryType === 'PICKUP') {
    return [input.pickupPoint?.name, input.pickupPoint?.address].filter(Boolean).join(' - ') || null
  }

  if (input.deliveryType === 'TOUR') {
    const cityLine = [input.deliveryPostalCode, input.deliveryCity].filter(Boolean).join(' ')
    return [input.deliveryAddress, cityLine].filter(Boolean).join(', ') || null
  }

  return null
}

function buildDefaultTime(input: FulfillmentInput) {
  if (input.deliveryType === 'FARM') {
    return null
  }

  if (input.deliveryType === 'PICKUP') {
    return input.pickupPoint?.pickupStartTime || null
  }

  if (input.deliveryType === 'TOUR' && input.deliveryTour) {
    return `${input.deliveryTour.startTime}-${input.deliveryTour.endTime}`
  }

  return null
}

function buildDefaultDate(input: FulfillmentInput) {
  if (input.deliveryType === 'FARM') {
    return null
  }

  if (input.deliveryType === 'PICKUP' && input.pickupPoint?.deliveryDay !== null && input.pickupPoint?.deliveryDay !== undefined) {
    return getNextDateForDayOfWeek(input.pickupPoint.deliveryDay)
  }

  if (input.deliveryType === 'TOUR' && input.deliveryTour) {
    return getNextDateForDayOfWeek(input.deliveryTour.dayOfWeek)
  }

  return null
}

export function getReservationFulfillment(input: FulfillmentInput) {
  return {
    fulfillmentDate: input.fulfillmentDate ?? buildDefaultDate(input),
    fulfillmentTime: input.fulfillmentTime ?? buildDefaultTime(input),
    fulfillmentLocation: input.fulfillmentLocation ?? buildDefaultLocation(input)
  }
}

export function formatFulfillmentDate(date: Date | null | undefined, locale = 'fr-FR') {
  if (!date) return ''
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function getDeliveryMethodLabel(deliveryType: Reservation['deliveryType']) {
  if (deliveryType === 'FARM') return 'Retrait a la ferme'
  if (deliveryType === 'PICKUP') return 'Retrait en point relais'
  if (deliveryType === 'TOUR') return 'Livraison (tournee)'
  return 'Retrait / livraison'
}
