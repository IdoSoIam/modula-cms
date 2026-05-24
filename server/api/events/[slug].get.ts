import { prisma } from '~/prisma/client'
import { canAccessEvent, eventToPayload } from '~/server/utils/events'
import { AuthService } from '~/server/services/auth/authService'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  }

  const item = await prisma.event.findUnique({
    where: { slug },
    include: {
      audienceRoles: {
        include: { role: true }
      }
    }
  })

  if (!item || item.status !== 'PUBLISHED') {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  const user = await authService.getUserFromSession(event)
  if (!canAccessEvent(item, {
    isAdmin: user?.access.isAdmin,
    canViewPrivateEvents: user?.access.specialPermissions.includes('view_private_events'),
    roleId: user?.roleId
  })) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  return eventToPayload(item)
})
