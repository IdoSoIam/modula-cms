import { prisma } from '#modula/prisma/client'
import { applyOccurrenceOverridesToEventPayload, canAccessEvent, eventToPayload } from '#modula/server/utils/events'
import { AuthService } from '#modula/server/services/auth/authService'
import { getFeatureFlags } from '#modula/server/utils/settings'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const previewDraft = query.previewDraft === '1'
  const occurrenceId = Number(query.occurrenceId)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  const featureFlags = await getFeatureFlags()
  if (!featureFlags.eventsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  const user = await authService.getUserFromSession(event)

  const item = await prisma.event.findUnique({
    where: { slug },
    include: {
      audienceMemberRoles: {
        include: { memberRole: true }
      }
    }
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  if (!(previewDraft && user?.access.isAdmin) && item.status !== 'PUBLISHED') {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  if (!canAccessEvent(item, {
    isAdmin: user?.access.isAdmin,
    canViewPrivateEvents: user?.access.specialPermissions.includes('view_private_events'),
    memberRoleIds: user?.memberRoleIds
  })) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  const payload = eventToPayload(item)
  if (Number.isInteger(occurrenceId) && occurrenceId > 0) {
    const occurrence = await prisma.eventOccurrence.findFirst({
      where: {
        id: occurrenceId,
        eventId: item.id
      }
    })
    if (!occurrence) {
      throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })
    }
    return applyOccurrenceOverridesToEventPayload(payload, occurrence)
  }

  return payload
})
