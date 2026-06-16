import { db } from '#modula/server/data/client'
import { canAccessEvent, submitInternalParticipation } from '#modula/server/utils/events'
import { AuthService } from '#modula/server/services/auth/authService'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const user = await authService.getUserFromSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Connexion requise' })
  }

  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  const eventRow = await db.event.findUnique({
    where: { slug },
    include: {
      audienceMemberRoles: {
        include: {
          memberRole: true
        }
      }
    }
  })
  if (!eventRow || eventRow.status !== 'PUBLISHED' || !eventRow.internalParticipationEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Participation indisponible' })
  }

  if (!canAccessEvent(eventRow, {
    isAdmin: user.access.isAdmin,
    canViewPrivateEvents: user.access.specialPermissions.includes('view_private_events'),
    memberRoleIds: user.memberRoleIds
  })) {
    throw createError({ statusCode: 403, statusMessage: 'Accès refusé' })
  }

  if (eventRow.audienceMemberRoles.length && !eventRow.audienceMemberRoles.some((entry) => user.memberRoleIds.includes(entry.memberRoleId))) {
    throw createError({ statusCode: 403, statusMessage: 'Rôle associatif non autorisé pour cette participation' })
  }

  const body = await readBody<{ message?: string, locale?: 'fr' | 'en' }>(event)
  const participation = await submitInternalParticipation(eventRow, {
    message: typeof body.message === 'string' ? body.message : ''
  }, user, body.locale === 'en' ? 'en' : 'fr')

  return { id: participation.id, status: participation.status }
})
