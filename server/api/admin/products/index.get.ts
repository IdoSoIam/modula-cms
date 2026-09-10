import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeProduct } from '#modula/server/utils/shop'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const archived = getQuery(event).archived === 'true'
  const categoryId = Number(getQuery(event).categoryId)
  const where: Record<string, unknown> = archived ? { deletedAt: { not: null } } : { deletedAt: null }
  if (Number.isInteger(categoryId) && categoryId > 0) where.categoryId = categoryId

  const rows = await db.product.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })

  return rows.map(serializeProduct)
})
