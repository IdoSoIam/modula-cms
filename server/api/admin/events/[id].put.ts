import { createOrUpdateEvent, normalizeEventPayload } from '~/server/utils/events'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'events', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant événement invalide' })
  }

  const payload = normalizeEventPayload(await readBody(event))
  payload.id = id
  const saved = await createOrUpdateEvent(payload, user.id)
  return { id: saved.id }
})
