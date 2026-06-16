import { db } from '#modula/server/data/client'
import { getNextDateForDayOfWeek } from '#modula/server/utils/orderFulfillment'
import { getFarmPickupConfig } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800')

  const now = new Date()
  const [pickupPoints, tours, farmPickup] = await Promise.all([
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
    getFarmPickupConfig()
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

  // Get unique list of all served cities for client-side filtering
  const allServedCities = [...new Set(tours.flatMap((t: any) => t.cities.map((c: any) => c.city.toLowerCase())))]

  return {
    farmPickup: {
      label: farmPickup.label,
      address: farmPickup.address,
      dayOfWeek: farmPickup.dayOfWeek,
      startTime: farmPickup.startTime,
      endTime: farmPickup.endTime,
      nextDate: getNextDateForDayOfWeek(farmPickup.dayOfWeek, now).toISOString(),
      slotLabel: farmPickup.slotLabel
    },
    pickupPoints,
    tours: formattedTours,
    servedCities: allServedCities
  }
})
