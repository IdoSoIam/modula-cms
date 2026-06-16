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
    monthlyPrice?: number | null
    notes?: string | null
    cities?: CityInput[]
    active?: boolean
  }>(event)

  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.dayOfWeek !== undefined) data.dayOfWeek = body.dayOfWeek
  if (body.startTime !== undefined) data.startTime = body.startTime
  if (body.endTime !== undefined) data.endTime = body.endTime
  if (body.monthlyPrice !== undefined) data.monthlyPrice = body.monthlyPrice
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null
  if (body.active !== undefined) data.active = body.active

  if (body.cities !== undefined) {
    await db.tourCity.deleteMany({ where: { tourId: id } })
    data.cities = {
      create: body.cities.filter(c => c.city.trim()).map(c => ({
        city: c.city.trim(),
        postalCodes: c.postalCodes?.trim() || null
      }))
    }
  }

  return db.deliveryTour.update({ where: { id }, data, include: { cities: true } })
})
