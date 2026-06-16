import { prisma } from '#modula/prisma/client'
import { getRuntimeRolePermissions, isRuntimeD1Active, listRuntimeRoles } from '#modula/server/platform/runtimeDb'
import { requirePermission } from '#modula/server/utils/permissions'
import { parseJsonSafe } from '#modula/server/utils/roles'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'roles', 'read')

  if (isRuntimeD1Active()) {
    const roles = await listRuntimeRoles()
    return await Promise.all(roles.map(async (role) => ({
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description || '',
      isSystem: Boolean(role.isSystem),
      isDefault: Boolean(role.isDefault),
      permissions: (await getRuntimeRolePermissions(role.id)).map(permission => ({
        module: permission.module,
        canRead: Boolean(permission.canRead),
        canCreate: Boolean(permission.canCreate),
        canUpdate: Boolean(permission.canUpdate),
        canDelete: Boolean(permission.canDelete)
      })),
      specialPermissions: parseJsonSafe(role.specialPermissionsJson)
    })))
  }

  const roles = await prisma.role.findMany({
    include: {
      permissions: true
    },
    orderBy: [
      { isSystem: 'desc' },
      { name: 'asc' }
    ]
  })

  return roles.map(role => ({
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description || '',
    isSystem: role.isSystem,
    isDefault: role.isDefault,
    permissions: role.permissions.map(permission => ({
      module: permission.module,
      canRead: permission.canRead,
      canCreate: permission.canCreate,
      canUpdate: permission.canUpdate,
      canDelete: permission.canDelete
    })),
    specialPermissions: parseJsonSafe(role.specialPermissionsJson)
  }))
})
