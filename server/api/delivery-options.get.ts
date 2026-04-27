import { prisma } from '../../prisma/client'

function getNextDateForDayOfWeek(dayOfWeek: number, fromDate = new Date()): Date {
  const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
  const diff = (dayOfWeek - base.getDay() + 7) % 7
  const result = new Date(base)
  result.setDate(base.getDate() + diff)
  // If the day already passed this week, go to next week
  if (result < fromDate) {
    result.setDate(result.getDate() + 7)
  }
  return result
}

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

  return { pickupPoints, tours: formattedTours, servedCities: allServedCities }
})
