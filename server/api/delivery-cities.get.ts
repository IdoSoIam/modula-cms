import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=900, stale-while-revalidate=1800')

  const cities = await db.tourCity.findMany({
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
