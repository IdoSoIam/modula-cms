import { prisma } from '~/prisma/client'
import { canAccessEvent, eventToListItem } from '~/server/utils/events'
import { AuthService } from '~/server/services/auth/authService'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const locale = getQuery(event).locale === 'en' ? 'en' : 'fr'
  const scope = getQuery(event).scope === 'planning' ? 'planning' : 'events'
  const user = await authService.getUserFromSession(event)
  const items = await prisma.event.findMany({
    where: {
      status: 'PUBLISHED'
    },
    include: {
      audienceRoles: {
        include: {
          role: true
        }
      }
    },
    orderBy: [
      { startsAt: 'asc' }
    ]
  })

  return items
    .filter(item => canAccessEvent(item, {
      isAdmin: user?.access.isAdmin,
      canViewPrivateEvents: user?.access.specialPermissions.includes('view_private_events'),
      roleId: user?.roleId
    }))
    .filter(item => scope === 'planning' || item.visibility === 'PUBLIC')
    .map(item => eventToListItem(item, locale))
})
