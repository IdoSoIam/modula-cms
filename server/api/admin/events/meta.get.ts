import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')

  const [roles, users] = await Promise.all([
    prisma.role.findMany({
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
        roleId: true
      }
    })
  ])

  return { roles, users }
})
