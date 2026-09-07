import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { isAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const associationRolesEnabled = await isAssociationRolesEnabled()

  const [memberRoles, users, memberships] = await Promise.all([
    associationRolesEnabled ? db.memberRole.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        slug: true,
        name: true,
        color: true
      }
    }) : Promise.resolve([]),
    db.user.findMany({
      where: { isActive: true },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' },
        { email: 'asc' }
      ],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
      }
    }),
    associationRolesEnabled ? db.userMemberRole.findMany({ select: { userId: true, memberRoleId: true } }) : Promise.resolve([])
  ])

  const rolesById = new Map<number, { id: number; name: string; slug: string; color: string | null }>(memberRoles.map((role: any) => [role.id, role]))
  const rolesByUser = new Map<number, Array<NonNullable<ReturnType<typeof rolesById.get>>>>()
  for (const membership of memberships) {
    const role = rolesById.get(membership.memberRoleId)
    if (!role) continue
    const roles = rolesByUser.get(membership.userId) || []
    roles.push(role)
    rolesByUser.set(membership.userId, roles)
  }

  return {
    memberRoles,
    users: users.map((user: any) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      memberRoleIds: (rolesByUser.get(user.id) || []).map(role => role.id),
      memberRoles: rolesByUser.get(user.id) || []
    }))
  }
})
