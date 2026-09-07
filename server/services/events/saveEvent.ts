import { createOrUpdateEvent, normalizeEventPayload } from '#modula/server/utils/events'
import { syncEventOccurrencesForEvent } from '#modula/server/utils/planning'
import { db } from '#modula/server/data/client'
import { notifyEventStatusChange } from './notifications'

export async function saveEvent(body: unknown, userId: number, id?: number) {
  const payload = normalizeEventPayload(body)
  // The route, never a client-supplied body ID, chooses which record is updated.
  payload.id = id
  const previous = id ? await db.event.findUnique({ where: { id } }) : null
  const saved = await createOrUpdateEvent(payload, userId)
  await syncEventOccurrencesForEvent(saved)
  const notification = previous ? await notifyEventStatusChange(previous.status, saved) : { sent: 0, failed: 0 }
  return { id: saved.id, slug: saved.slug, notification }
}
