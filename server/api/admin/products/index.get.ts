import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeProduct } from '#modula/server/utils/shop'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db.product.findMany({
    include: {
      category: true
    },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  return rows.map(serializeProduct)
})
