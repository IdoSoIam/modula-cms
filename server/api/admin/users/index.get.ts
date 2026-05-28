import { prisma } from '#modula/prisma/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { isAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'read')
  const associationRolesEnabled = await isAssociationRolesEnabled()

  const users = await prisma.user.findMany({
    include: {
      managedRole: true,
      memberRoles: {
        include: {
          memberRole: true
        }
      }
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
    memberRoleIds: associationRolesEnabled ? user.memberRoles.map(entry => entry.memberRoleId) : [],
    memberRoles: associationRolesEnabled ? user.memberRoles.map(entry => ({
      id: entry.memberRole.id,
      slug: entry.memberRole.slug,
      name: entry.memberRole.name,
      color: entry.memberRole.color
    })) : [],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }))
})
