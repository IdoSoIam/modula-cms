import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'delete')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant événement invalide' })
  }
  const reservations = await db.eventPublicReservation.count({ where: { eventId: id } })
  const participations = await db.eventInternalParticipation.count({ where: { eventId: id } })
  if (reservations || participations) {
    throw createError({ statusCode: 409, message: 'Cet événement possède des inscriptions. Annulez-le ou archivez-le pour conserver leur historique et prévenir les inscrits.' })
  }
  await db.event.delete({ where: { id } })
  return { ok: true }
})
