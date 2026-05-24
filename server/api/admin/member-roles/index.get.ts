import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'read')

  return prisma.memberRole.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })
})
