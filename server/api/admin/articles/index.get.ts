import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await db.article.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } }
  })
  return items
})
