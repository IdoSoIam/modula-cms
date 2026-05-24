import { AuthService } from '~/server/services/auth/authService'
import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

const authService = new AuthService()

function randomPassword() {
  return Math.random().toString(36).slice(2, 12) + 'A1!'
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'create')
  const body = await readBody<{
    email?: string
    firstName?: string
    lastName?: string
    roleId?: number | string | null
    memberRoleIds?: Array<number | string>
    password?: string
  }>(event)

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email requis' })
  }

  const normalizedRoleId = body.roleId == null || body.roleId === '' || body.roleId === 'null' ? null : Number(body.roleId)
  const roleRow = normalizedRoleId && Number.isInteger(normalizedRoleId)
    ? await prisma.role.findUnique({ where: { id: normalizedRoleId } })
    : await prisma.role.findFirst({ where: { isDefault: true }, orderBy: { id: 'asc' } })

  const password = typeof body.password === 'string' && body.password.trim() ? body.password.trim() : randomPassword()
  const user = await authService.createUser(
    email,
    password,
    typeof body.firstName === 'string' ? body.firstName.trim() : undefined,
    typeof body.lastName === 'string' ? body.lastName.trim() : undefined,
    undefined,
    roleRow?.slug || 'utilisateur_public'
  )

  if (roleRow && user.roleId !== roleRow.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: roleRow.id }
    })
  }

  const memberRoleIds = Array.isArray(body.memberRoleIds)
    ? Array.from(new Set(body.memberRoleIds.map(value => Number(value)).filter(value => Number.isInteger(value) && value > 0)))
    : []

  if (memberRoleIds.length) {
    await prisma.userMemberRole.createMany({
      data: memberRoleIds.map(memberRoleId => ({
        userId: user.id,
        memberRoleId
      }))
    })
  }

  return {
    id: user.id,
    generatedPassword: password
  }
})
