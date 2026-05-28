import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return prisma.pickupPoint.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] })
})
