import { saveEvent } from '#modula/server/services/events/saveEvent'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'events', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant événement invalide' })
  }

  return saveEvent(await readBody(event), user.id, id)
})
