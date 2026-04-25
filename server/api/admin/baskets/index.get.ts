import { requireAdmin } from '~/server/utils/requireAdmin'
import { serializeBasket } from '~/server/utils/baskets'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const baskets = await prisma.basket.findMany({
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { items: { include: { vegetable: true } } }
  })
  return baskets.map(serializeBasket)
})
