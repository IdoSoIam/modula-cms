import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeProductLot } from '#modula/server/utils/shop'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db.productLot.findMany({
    include: {
      category: true,
      items: {
        include: {
          product: true
        }
      }
    },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  return rows.map(serializeProductLot)
})
