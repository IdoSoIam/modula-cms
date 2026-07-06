import { AuthService } from '#modula/server/services/auth/authService'
import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { isAssociationRolesEnabled } from '#modula/server/utils/settings'
import { sendUserInvitationEmail } from '#modula/server/services/auth/userInvitation'

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
    inviteMode?: boolean
  }>(event)

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email requis' })
  }

  const normalizedRoleId = body.roleId == null || body.roleId === '' || body.roleId === 'null' ? null : Number(body.roleId)
  const roleRow = normalizedRoleId && Number.isInteger(normalizedRoleId)
    ? await db.role.findUnique({ where: { id: normalizedRoleId } })
    : await db.role.findFirst({ where: { isDefault: true }, orderBy: { id: 'asc' } })

  const firstName = typeof body.firstName === 'string' ? body.firstName.trim() : undefined
  const lastName = typeof body.lastName === 'string' ? body.lastName.trim() : undefined
  const inviteMode = body.inviteMode === true
  const created = inviteMode
    ? await authService.createInvitedUser(
        email,
        firstName,
        lastName,
        undefined,
        roleRow?.slug || 'utilisateur_public'
      )
    : null
  const password = inviteMode ? null : (typeof body.password === 'string' && body.password.trim() ? body.password.trim() : randomPassword())
  const user = created?.user ?? await authService.createUser(
    email,
    password!,
    firstName,
    lastName,
    undefined,
    roleRow?.slug || 'utilisateur_public'
  )

  if (roleRow && user.roleId !== roleRow.id) {
    await db.user.update({
      where: { id: user.id },
      data: { roleId: roleRow.id }
    })
  }

  const memberRoleIds = Array.isArray(body.memberRoleIds)
    ? Array.from(new Set(body.memberRoleIds.map(value => Number(value)).filter(value => Number.isInteger(value) && value > 0)))
    : []
  const associationRolesEnabled = await isAssociationRolesEnabled()

  if (!associationRolesEnabled && memberRoleIds.length) {
    throw createError({ statusCode: 404, statusMessage: 'Rôles associatifs désactivés' })
  }

  if (associationRolesEnabled && memberRoleIds.length) {
    await db.userMemberRole.createMany({
      data: memberRoleIds.map(memberRoleId => ({
        userId: user.id,
        memberRoleId
      }))
    })
  }

  if (created) {
    await sendUserInvitationEmail({
      email,
      firstName,
      lastName,
      setupToken: created.setupToken,
      expiresAt: created.expiresAt
    })
  }

  return {
    id: user.id,
    ...(password ? { generatedPassword: password } : {}),
    ...(created ? { invitationSent: true } : {})
  }
})
