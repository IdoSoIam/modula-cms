import { createOrUpdateEvent, normalizeEventPayload } from '#modula/server/utils/events'
import { syncEventOccurrencesForEvent } from '#modula/server/utils/planning'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'events', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant événement invalide' })
  }

  const payload = normalizeEventPayload(await readBody(event))
  payload.id = id
  const saved = await createOrUpdateEvent(payload, user.id)
  await syncEventOccurrencesForEvent(saved as any)
  return { id: saved.id, slug: saved.slug }
})
