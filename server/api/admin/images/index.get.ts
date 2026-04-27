import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.image.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return items
})
