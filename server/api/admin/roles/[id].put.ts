import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { normalizeRolePayload } from '#modula/server/utils/roles'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'roles', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant de rôle invalide' })
  }

  const existing = await db.role.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rôle introuvable' })
  }

  const body = normalizeRolePayload(await readBody(event), existing.isSystem)

  await db.role.update({
    where: { id },
    data: {
      slug: existing.isSystem ? existing.slug : body.slug,
      name: body.name,
      description: body.description || null,
      isDefault: body.isDefault,
      specialPermissionsJson: JSON.stringify(body.specialPermissions)
    }
  })

  await db.rolePermission.deleteMany({ where: { roleId: id } })
  if (body.permissions.length) {
    await db.rolePermission.createMany({
      data: body.permissions.map(permission => ({
        roleId: id,
        module: permission.module,
        canRead: permission.canRead,
        canCreate: permission.canCreate,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete
      }))
    })
  }

  return { ok: true }
})
