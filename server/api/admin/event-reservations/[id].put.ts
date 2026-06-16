import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'event_reservations', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant réservation invalide' })
  }

  const body = await readBody<{ status?: string; adminNote?: string }>(event)
  const status = body.status
  if (!status || !['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'].includes(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Statut invalide' })
  }

  await db.eventPublicReservation.update({
    where: { id },
    data: {
      status: status as any,
      adminNote: typeof body.adminNote === 'string' ? body.adminNote.trim() || null : undefined,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      cancelledAt: status === 'CANCELLED' ? new Date() : null,
      rejectedAt: status === 'REJECTED' ? new Date() : null
    }
  })

  return { ok: true }
})
