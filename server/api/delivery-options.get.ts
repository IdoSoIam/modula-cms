import { prisma } from '../../prisma/client'
import { getNextDateForDayOfWeek } from '~/server/utils/reservationFulfillment'

export default defineEventHandler(async () => {
  const now = new Date()
  const [pickupPoints, tours] = await Promise.all([
    prisma.pickupPoint.findMany({
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
    prisma.deliveryTour.findMany({
      where: { active: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: { cities: true }
    })
  ])

  const formattedTours = tours.map(t => {
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
      cities: t.cities.map(c => ({
        id: c.id,
        city: c.city,
        postalCodes: c.postalCodes
      }))
    }
  })

  // Get unique list of all served cities for client-side filtering
  const allServedCities = [...new Set(tours.flatMap(t => t.cities.map(c => c.city.toLowerCase())))]

  return {
    farmPickup: {
      label: 'Retrait a la ferme',
      location: 'Ferme du Campeyrigoux'
    },
    pickupPoints,
    tours: formattedTours,
    servedCities: allServedCities
  }
})
