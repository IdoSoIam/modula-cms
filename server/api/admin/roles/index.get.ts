import { prisma } from '#modula/prisma/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { parseJsonSafe } from '#modula/server/utils/roles'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'roles', 'read')

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
