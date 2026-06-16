import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { eventToListItem } from '#modula/server/utils/events'
import type { CmsLocale } from '#modula/shared/cms'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const query = getQuery(event)
  const locale = query.locale === 'en' ? 'en' : 'fr'
  const status = typeof query.status === 'string' ? query.status : ''

  const items = await db.event.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      audienceMemberRoles: {
        include: {
          memberRole: true
        }
      }
    },
    orderBy: [
      { startsAt: 'asc' },
      { createdAt: 'desc' }
    ]
  })

  return items.map(item => ({
    ...eventToListItem(item, locale as CmsLocale),
    audienceMemberRoles: item.audienceMemberRoles.map(entry => ({
      id: entry.memberRole.id,
      slug: entry.memberRole.slug,
      name: entry.memberRole.name
    }))
  }))
})
