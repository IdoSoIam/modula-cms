import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncReservationToGoogleCalendar } from '#modula/server/utils/googleCalendarSync'
import { isSubscriptionsEnabled } from '#modula/server/utils/settings'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  if (!reservation) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  }

  if (reservation.status !== 'CONFIRMED') {
    throw createError({ statusCode: 400, statusMessage: 'Seules les reservations confirmées peuvent être synchronisées' })
  }

  const result = await syncReservationToGoogleCalendar(reservation, await isSubscriptionsEnabled())
  if (!result.synced) {
    throw createError({ statusCode: 400, statusMessage: result.reason || 'Synchronisation Google Calendar impossible' })
  }

  return { ok: true, eventId: result.eventId }
})
