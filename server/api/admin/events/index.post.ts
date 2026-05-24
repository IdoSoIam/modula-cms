import { createOrUpdateEvent, normalizeEventPayload } from '~/server/utils/events'
import { syncEventOccurrencesForEvent } from '~/server/utils/planning'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'events', 'create')
  const payload = normalizeEventPayload(await readBody(event))
  const saved = await createOrUpdateEvent(payload, user.id)
  await syncEventOccurrencesForEvent(saved as any)
  return { id: saved.id, slug: saved.slug }
})
