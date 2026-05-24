import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')

  const [memberRoles, users] = await Promise.all([
    prisma.memberRole.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        slug: true,
        name: true
      }
    }),
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
      memberRoleIds: user.memberRoles.map(entry => entry.memberRoleId),
      memberRoles: user.memberRoles.map(entry => ({
        id: entry.memberRole.id,
        slug: entry.memberRole.slug,
        name: entry.memberRole.name,
        color: entry.memberRole.color
      }))
    }))
  }
})
