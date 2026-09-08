import { db } from '#modula/server/data/client'
import { serializeProductOptionSet } from '#modula/server/utils/shop'
import { requireAdmin } from '#modula/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const rows = await db.productOptionSet.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })
  return rows.map(serializeProductOptionSet)
})
