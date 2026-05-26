import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'
import { requireAssociationRolesEnabled } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAssociationRolesEnabled()
  await requirePermission(event, 'users', 'read')

  return prisma.memberRole.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })
})
