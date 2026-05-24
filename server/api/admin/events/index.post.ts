import { createOrUpdateEvent, normalizeEventPayload } from '~/server/utils/events'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'events', 'create')
  const payload = normalizeEventPayload(await readBody(event))
  const saved = await createOrUpdateEvent(payload, user.id)
  return { id: saved.id }
})
