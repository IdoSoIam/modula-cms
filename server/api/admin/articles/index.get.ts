import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.article.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } }
  })
  return items
})
