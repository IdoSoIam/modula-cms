import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { createRuntimeDeliveryTour, isRuntimeD1Active } from '#modula/server/platform/runtimeDb'
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
    monthlyPrice?: number | null
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

  if (isRuntimeD1Active()) {
    return await createRuntimeDeliveryTour({
      name: body.name.trim(),
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      monthlyPrice: body.monthlyPrice ?? null,
      notes: body.notes?.trim() || null,
      active: body.active ?? true,
      cities: body.cities?.filter(c => c.city.trim()).map(c => ({
        city: c.city.trim(),
        postalCodes: c.postalCodes?.trim() || null
      })) || []
    })
  }

  return db.deliveryTour.create({
    data: {
      name: body.name.trim(),
      dayOfWeek: body.dayOfWeek,
      startTime: body.startTime,
      endTime: body.endTime,
      monthlyPrice: body.monthlyPrice ?? null,
      notes: body.notes?.trim() || null,
      active: body.active ?? true,
      cities: {
        create: body.cities?.filter(c => c.city.trim()).map(c => ({
          city: c.city.trim(),
          postalCodes: c.postalCodes?.trim() || null
        })) || []
      }
    },
    include: { cities: true }
  })
})
