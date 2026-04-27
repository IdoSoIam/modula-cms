import { prisma } from '../../prisma/client'

export default defineEventHandler(async () => {
  const cities = await prisma.tourCity.findMany({
    select: { city: true, postalCodes: true },
    orderBy: { city: 'asc' }
  })

  // Dédoublonner et trier
  const uniqueCities = Array.from(new Map(cities.map(c => [c.city.toLowerCase(), c])).values())
    .sort((a, b) => a.city.localeCompare(b.city))

  return uniqueCities.map(c => ({
    city: c.city,
    postalCodes: c.postalCodes
  }))
})
