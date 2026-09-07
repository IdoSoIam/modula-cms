import { updateEventRegistration } from '#modula/server/services/events/notifications'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'event_reservations', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant participation invalide' })
  }

  const body = await readBody<{ status?: string; adminNote?: string }>(event)
  const status = body.status
  if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Statut invalide' })
  }

  const notification = await updateEventRegistration('participation', id, status, body.adminNote)

  return { ok: true, notification }
})
