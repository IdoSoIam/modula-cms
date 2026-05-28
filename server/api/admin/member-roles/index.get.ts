import { prisma } from '#modula/prisma/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { requireAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAssociationRolesEnabled()
  await requirePermission(event, 'users', 'read')

  return prisma.memberRole.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })
})
