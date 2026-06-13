import { prisma } from '#modula/prisma/client'
import { getRuntimeRoleById, getRuntimeUserMemberRoles, isRuntimeD1Active, listRuntimeUsers } from '#modula/server/platform/runtimeDb'
import { requirePermission } from '#modula/server/utils/permissions'
import { isAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'read')
  const associationRolesEnabled = await isAssociationRolesEnabled()

  if (isRuntimeD1Active()) {
    const users = await listRuntimeUsers()
    return await Promise.all(users.map(async (user) => {
      const [managedRole, memberRoles] = await Promise.all([
        user.roleId ? getRuntimeRoleById(user.roleId) : Promise.resolve(null),
        associationRolesEnabled ? getRuntimeUserMemberRoles(user.id) : Promise.resolve([])
      ])

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        role: user.role,
        roleId: user.roleId,
        roleSlug: managedRole?.slug || user.role,
        roleName: managedRole?.slug || user.role,
        memberRoleIds: associationRolesEnabled ? memberRoles.map(entry => entry.id) : [],
        memberRoles: associationRolesEnabled ? memberRoles.map(entry => ({
          id: entry.id,
          slug: entry.slug,
          name: entry.name,
          color: entry.color
        })) : [],
        isActive: Boolean(user.isActive),
        createdAt: user.createdAt
      }
    }))
  }

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
