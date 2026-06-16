import { db } from '#modula/server/data/client'
import { eventOccurrenceToPayload, eventToPayload } from '#modula/server/utils/events'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant occurrence invalide' })
  }

  const occurrence = await db.eventOccurrence.findUnique({
    where: { id },
    include: {
      event: {
        include: {
          audienceMemberRoles: {
            include: { memberRole: true }
          }
        }
      }
    }
  })

  if (!occurrence) {
    throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })
  }

  return {
    ...eventOccurrenceToPayload(occurrence),
    event: eventToPayload(occurrence.event as any)
  }
})
