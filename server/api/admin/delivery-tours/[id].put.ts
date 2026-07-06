import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

interface CityInput {
  city: string
  postalCodes?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<{
    name?: string
    dayOfWeek?: number
    startTime?: string
    endTime?: string
    notes?: string | null
    cities?: CityInput[]
    active?: boolean
  }>(event)

  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.dayOfWeek !== undefined) data.dayOfWeek = body.dayOfWeek
  if (body.startTime !== undefined) data.startTime = body.startTime
  if (body.endTime !== undefined) data.endTime = body.endTime
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null
  if (body.active !== undefined) data.active = body.active

  await db.deliveryTour.update({ where: { id }, data })

  if (body.cities !== undefined) {
    const cities = body.cities
      .filter(c => c.city.trim())
      .map(c => ({
        tourId: id,
        city: c.city.trim(),
        postalCodes: c.postalCodes?.trim() || null
      }))

    await db.tourCity.deleteMany({ where: { tourId: id } })
    if (cities.length) {
      await db.tourCity.createMany({ data: cities })
    }
  }

  return db.deliveryTour.findUnique({ where: { id }, include: { cities: true } })
})
