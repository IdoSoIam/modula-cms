import type { DeliveryTour, PickupPoint } from '#modula/server/data/types'
import { getDefaultTimeZone } from './dateFormat'
import type { OnSitePickupConfig } from './settings'

type FulfillmentDeliveryType = 'FARM' | 'ONSITE' | 'PICKUP' | 'TOUR' | null
type DeliveryTypeLabelInput = 'ONSITE' | 'PICKUP' | 'TOUR' | 'FARM' | null

function normalizeReservationLocale(value: string | null | undefined) {
  return value === 'en' ? 'en' : 'fr'
}

function isOnSiteDeliveryType(value: FulfillmentDeliveryType) {
  return value === 'ONSITE' || value === 'FARM'
}

interface FulfillmentInput {
  deliveryType: FulfillmentDeliveryType
  pickupPoint: Pick<PickupPoint, 'name' | 'address' | 'deliveryDay' | 'pickupStartTime'> | null
  deliveryTour: Pick<DeliveryTour, 'name' | 'dayOfWeek' | 'startTime' | 'endTime'> | null
  onSitePickup?: Pick<OnSitePickupConfig, 'address' | 'dayOfWeek' | 'startTime'> | null
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
  if (isOnSiteDeliveryType(input.deliveryType)) {
    return input.onSitePickup?.address || null
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
  if (isOnSiteDeliveryType(input.deliveryType)) {
    return input.onSitePickup?.startTime || null
  }

  if (input.deliveryType === 'PICKUP') {
    return input.pickupPoint?.pickupStartTime || null
  }

  if (input.deliveryType === 'TOUR' && input.deliveryTour) {
    return null
  }

  return null
}

function buildDefaultDate(input: FulfillmentInput) {
  if (isOnSiteDeliveryType(input.deliveryType)) {
    return input.onSitePickup ? getNextDateForDayOfWeek(input.onSitePickup.dayOfWeek) : null
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
    timeZone: getDefaultTimeZone(),
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date)
}

export function getDeliveryMethodLabel(deliveryType: DeliveryTypeLabelInput, locale: string | null | undefined = 'fr') {
  if (normalizeReservationLocale(locale) === 'en') {
    if (isOnSiteDeliveryType(deliveryType)) return 'On-site pickup'
    if (deliveryType === 'PICKUP') return 'Pickup point collection'
    if (deliveryType === 'TOUR') return 'Home delivery'
    return 'Pickup / delivery'
  }

  if (isOnSiteDeliveryType(deliveryType)) return 'Retrait sur place'
  if (deliveryType === 'PICKUP') return 'Retrait en point relais'
  if (deliveryType === 'TOUR') return 'Livraison à domicile'
  return 'Retrait / livraison'
}

export function getDeliveryWindowLabel(input: Pick<FulfillmentInput, 'deliveryType' | 'pickupPoint' | 'deliveryTour'>) {
  if (input.deliveryType === 'PICKUP' && input.pickupPoint?.pickupStartTime) {
    return input.pickupPoint.pickupStartTime
  }

  if (input.deliveryType === 'TOUR' && input.deliveryTour) {
    return `${input.deliveryTour.startTime}-${input.deliveryTour.endTime}`
  }

  return ''
}
