import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await db.vegetable.findMany({ orderBy: { name: 'asc' } })
  return items.map((v: any) => ({ ...v, price: Number(v.price) }))
})
