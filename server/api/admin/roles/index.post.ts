import { prisma } from '~/prisma/client'
import { DEFAULT_ROLE_DEFINITIONS, type AdminPermissionModule } from '~/shared/access'
import { requirePermission } from '~/server/utils/permissions'
import { normalizeRolePayload } from '~/server/utils/roles'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'roles', 'create')
  const body = normalizeRolePayload(await readBody(event), false)

  const role = await prisma.role.create({
    data: {
      slug: body.slug,
      name: body.name,
      description: body.description || null,
      isSystem: false,
      isDefault: body.isDefault,
      specialPermissionsJson: JSON.stringify(body.specialPermissions),
      permissions: {
        create: body.permissions.map(permission => ({
          module: permission.module as AdminPermissionModule,
          canRead: permission.canRead,
          canCreate: permission.canCreate,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete
        }))
      }
    },
    select: { id: true }
  })

  return role
})
