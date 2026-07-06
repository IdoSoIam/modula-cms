import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

interface CityInput {
  city: string
  postalCodes?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{
    name: string
    dayOfWeek: number
    startTime: string
    endTime: string
    notes?: string
    cities?: CityInput[]
    active?: boolean
  }>(event)

  if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  if (typeof body.dayOfWeek !== 'number' || body.dayOfWeek < 0 || body.dayOfWeek > 6) {
    throw createError({ statusCode: 400, statusMessage: 'Jour de la semaine requis (0-6)' })
  }
  if (!body.startTime || !body.endTime) {
    throw createError({ statusCode: 400, statusMessage: 'Plage horaire requise' })
  }

  const tour = await db.deliveryTour.create({
    data: {
      name: body.name.trim(),
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes?.trim() || null,
      active: body.active ?? true
    }
  })

  const cities = (body.cities || [])
    .filter(c => c.city.trim())
    .map(c => ({
      tourId: tour.id,
      city: c.city.trim(),
      postalCodes: c.postalCodes?.trim() || null
    }))

  if (cities.length) {
    await db.tourCity.createMany({ data: cities })
  }

  return db.deliveryTour.findUnique({
    where: { id: tour.id },
    include: { cities: true }
  })
})
