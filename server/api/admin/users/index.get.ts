import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'read')

  const users = await prisma.user.findMany({
    include: {
      managedRole: true
    },
    orderBy: [
      { createdAt: 'desc' }
    ]
  })

  return users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role,
    roleId: user.roleId,
    roleSlug: user.managedRole?.slug || user.role,
    roleName: user.managedRole?.name || user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }))
})
