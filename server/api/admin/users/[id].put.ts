import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant utilisateur invalide' })
  }

  const body = await readBody<{
    firstName?: string
    lastName?: string
    roleId?: number | string | null
    isActive?: boolean
  }>(event)
  const normalizedRoleId = body.roleId == null || body.roleId === '' || body.roleId === 'null' ? null : Number(body.roleId)

  await prisma.user.update({
    where: { id },
    data: {
      firstName: typeof body.firstName === 'string' ? body.firstName.trim() : undefined,
      lastName: typeof body.lastName === 'string' ? body.lastName.trim() : undefined,
      roleId: normalizedRoleId === null || Number.isNaN(normalizedRoleId) ? null : (Number.isInteger(normalizedRoleId) ? normalizedRoleId : undefined),
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined
    }
  })

  return { ok: true }
})
