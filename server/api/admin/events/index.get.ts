import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'
import { eventToListItem } from '~/server/utils/events'
import type { CmsLocale } from '~/shared/cms'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const query = getQuery(event)
  const locale = query.locale === 'en' ? 'en' : 'fr'
  const status = typeof query.status === 'string' ? query.status : ''

  const items = await prisma.event.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      audienceRoles: {
        include: {
          role: true
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
    audienceRoles: item.audienceRoles.map(entry => ({
      id: entry.role.id,
      slug: entry.role.slug,
      name: entry.role.name
    }))
  }))
})
