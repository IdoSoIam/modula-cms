import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { serializeBasket } from '#modula/server/utils/baskets'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const baskets = await db.basket.findMany({
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { items: { include: { vegetable: true } } }
  })
  return baskets.map(serializeBasket)
})
