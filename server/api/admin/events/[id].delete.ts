import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'delete')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant événement invalide' })
  }
  await db.event.delete({ where: { id } })
  return { ok: true }
})
