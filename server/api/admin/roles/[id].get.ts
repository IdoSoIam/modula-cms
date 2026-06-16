import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { parseJsonSafe } from '#modula/server/utils/roles'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'roles', 'read')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant de rôle invalide' })
  }

  const role = await db.role.findUnique({
    where: { id },
    include: {
      permissions: true
    }
  })

  if (!role) {
    throw createError({ statusCode: 404, statusMessage: 'Rôle introuvable' })
  }

  return {
    id: role.id,
    slug: role.slug,
    name: role.name,
    description: role.description || '',
    isSystem: role.isSystem,
    isDefault: role.isDefault,
    permissions: role.permissions.map((permission: any) => ({
      module: permission.module,
      canRead: permission.canRead,
      canCreate: permission.canCreate,
      canUpdate: permission.canUpdate,
      canDelete: permission.canDelete
    })),
    specialPermissions: parseJsonSafe(role.specialPermissionsJson)
  }
})
