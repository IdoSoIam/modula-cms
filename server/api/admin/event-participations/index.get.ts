import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { resolveEventTranslation } from '#modula/server/utils/events'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'event_reservations', 'read')
  const query = getQuery(event)
  const eventId = Number(query.eventId)
  const status = typeof query.status === 'string' ? query.status : ''

  const rows = await db.eventInternalParticipation.findMany({
    where: {
      ...(Number.isInteger(eventId) && eventId > 0 ? { eventId } : {}),
      ...(status ? { status: status as any } : {})
    },
    include: {
      event: true,
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      }
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })
  return rows.map(row => ({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    event: {
      id: row.event.id,
      slug: row.event.slug,
      title: resolveEventTranslation(row.event, 'fr').title
    }
  }))
})
