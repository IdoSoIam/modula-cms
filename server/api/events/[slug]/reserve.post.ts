import { prisma } from '~/prisma/client'
import { normalizeEventPayload, submitEventPublicReservation } from '~/server/utils/events'
import { AuthService } from '~/server/services/auth/authService'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  const body = await readBody<{ customerName?: string; email?: string; phone?: string; seats?: number; message?: string; locale?: 'fr' | 'en' }>(event)
  const eventRow = await prisma.event.findUnique({
    where: { slug },
    include: {
      audienceRoles: { include: { role: true } }
    }
  })
  if (!eventRow || eventRow.status !== 'PUBLISHED' || !eventRow.publicReservationEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Réservation indisponible' })
  }

  const user = await authService.getUserFromSession(event)
  const reservation = await submitEventPublicReservation(eventRow, {
    customerName: typeof body.customerName === 'string' ? body.customerName : '',
    email: typeof body.email === 'string' ? body.email : '',
    phone: typeof body.phone === 'string' ? body.phone : '',
    seats: Number(body.seats) || 1,
    message: typeof body.message === 'string' ? body.message : ''
  }, body.locale === 'en' ? 'en' : 'fr', user?.id)

  return { id: reservation.id }
})
