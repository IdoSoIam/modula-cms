import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.vegetable.findMany({ orderBy: { name: 'asc' } })
  return items.map(v => ({ ...v, price: Number(v.price) }))
})
