import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'
import { isAssociationRolesEnabled } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const associationRolesEnabled = await isAssociationRolesEnabled()

  const [memberRoles, users] = await Promise.all([
    associationRolesEnabled ? prisma.memberRole.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        slug: true,
        name: true
      }
    }) : Promise.resolve([]),
    prisma.user.findMany({
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
        lastName: true,
        memberRoles: {
          include: {
            memberRole: true
          }
        }
      }
    })
  ])

  return {
    memberRoles,
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      memberRoleIds: associationRolesEnabled ? user.memberRoles.map(entry => entry.memberRoleId) : [],
      memberRoles: associationRolesEnabled ? user.memberRoles.map(entry => ({
        id: entry.memberRole.id,
        slug: entry.memberRole.slug,
        name: entry.memberRole.name,
        color: entry.memberRole.color
      })) : []
    }))
  }
})
