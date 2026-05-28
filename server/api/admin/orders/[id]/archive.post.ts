import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: { id: true, status: true, archivedAt: true }
  })

  if (!reservation) {
    throw createError({ statusCode: 404, statusMessage: 'Reservation introuvable' })
  }

  if (!['REJECTED', 'CANCELLED'].includes(reservation.status)) {
    throw createError({ statusCode: 400, statusMessage: 'Seules les reservations refusees ou annulees peuvent etre archivees' })
  }

  if (reservation.archivedAt) {
    return { ok: true, alreadyArchived: true }
  }

  await prisma.reservation.update({
    where: { id },
    data: { archivedAt: new Date() }
  })

  return { ok: true, archived: true }
})
