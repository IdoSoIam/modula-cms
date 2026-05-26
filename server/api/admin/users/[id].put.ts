import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'
import { isAssociationRolesEnabled } from '~/server/utils/settings'

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
    memberRoleIds?: Array<number | string>
    isActive?: boolean
  }>(event)
  const normalizedRoleId = body.roleId == null || body.roleId === '' || body.roleId === 'null' ? null : Number(body.roleId)
  const memberRoleIds = Array.isArray(body.memberRoleIds)
    ? Array.from(new Set(body.memberRoleIds.map(value => Number(value)).filter(value => Number.isInteger(value) && value > 0)))
    : []
  const associationRolesEnabled = await isAssociationRolesEnabled()

  if (!associationRolesEnabled && memberRoleIds.length) {
    throw createError({ statusCode: 404, statusMessage: 'Rôles associatifs désactivés' })
  }

  await prisma.user.update({
    where: { id },
    data: {
      firstName: typeof body.firstName === 'string' ? body.firstName.trim() : undefined,
      lastName: typeof body.lastName === 'string' ? body.lastName.trim() : undefined,
      roleId: normalizedRoleId === null || Number.isNaN(normalizedRoleId) ? null : (Number.isInteger(normalizedRoleId) ? normalizedRoleId : undefined),
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined
    }
  })

  if (associationRolesEnabled) {
    await prisma.userMemberRole.deleteMany({
      where: { userId: id }
    })

    if (memberRoleIds.length) {
      await prisma.userMemberRole.createMany({
        data: memberRoleIds.map(memberRoleId => ({
          userId: id,
          memberRoleId
        }))
      })
    }
  }

  return { ok: true }
})
