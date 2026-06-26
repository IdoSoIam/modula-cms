import { db } from '#modula/server/data/client'
import { getNextDateForDayOfWeek } from '#modula/server/utils/orderFulfillment'
import { getOnSitePickupConfig } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800')

  const now = new Date()
  const [pickupPoints, tours, onSitePickup] = await Promise.all([
    db.pickupPoint.findMany({
      where: { active: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        address: true,
        details: true,
        deliveryDay: true,
        pickupStartTime: true,
        openingHours: true,
        websiteUrl: true
      }
    }),
    db.deliveryTour.findMany({
      where: { active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { cities: true }
    }),
    getOnSitePickupConfig()
  ])

  const formattedTours = tours.map((t: any) => {
    const nextDate = getNextDateForDayOfWeek(t.dayOfWeek, now)
    return {
      id: t.id,
      name: t.name,
      dayOfWeek: t.dayOfWeek,
      nextDate: nextDate.toISOString(),
      startTime: t.startTime,
      endTime: t.endTime,
      monthlyPrice: t.monthlyPrice !== null ? Number(t.monthlyPrice) : null,
      notes: t.notes,
      cities: t.cities.map((c: any) => ({
        id: c.id,
        city: c.city,
        postalCodes: c.postalCodes
      }))
    }
  })

  const allServedCities = Array.from(
    new Map(
      tours
        .flatMap((tour: any) => tour.cities.map((city: any) => String(city.city || '').trim()))
        .filter(Boolean)
        .map((city: string) => [city.toLowerCase(), city])
    ).values()
  ).sort((left, right) => left.localeCompare(right, 'fr'))

  return {
    onSitePickup: {
      label: onSitePickup.label,
      address: onSitePickup.address,
      dayOfWeek: onSitePickup.dayOfWeek,
      startTime: onSitePickup.startTime,
      endTime: onSitePickup.endTime,
      nextDate: getNextDateForDayOfWeek(onSitePickup.dayOfWeek, now).toISOString(),
      slotLabel: onSitePickup.slotLabel
    },
    pickupPoints,
    tours: formattedTours,
    servedCities: allServedCities
  }
})
