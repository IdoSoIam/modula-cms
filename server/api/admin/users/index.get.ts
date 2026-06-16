import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { isAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'read')
  const associationRolesEnabled = await isAssociationRolesEnabled()

  const users = await db.user.findMany({
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

  return users.map((user: any) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    role: user.role,
    roleId: user.roleId,
    roleSlug: user.managedRole?.slug || user.role,
    roleName: user.managedRole?.name || user.role,
    memberRoleIds: associationRolesEnabled ? user.memberRoles.map((entry: any) => entry.memberRoleId) : [],
    memberRoles: associationRolesEnabled ? user.memberRoles.map((entry: any) => ({
      id: entry.memberRole.id,
      slug: entry.memberRole.slug,
      name: entry.memberRole.name,
      color: entry.memberRole.color
    })) : [],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString()
  }))
})
