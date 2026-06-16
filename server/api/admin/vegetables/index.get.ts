import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isRuntimeD1Active, listRuntimeVegetables } from '#modula/server/platform/runtimeDb'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (isRuntimeD1Active()) {
    const items = await listRuntimeVegetables()
    return items.map((vegetable) => ({
      ...vegetable,
      price: Number(vegetable.price),
      active: vegetable.active === true || vegetable.active === 1
    }))
  }
  const items = await db.vegetable.findMany({ orderBy: { name: 'asc' } })
  return items.map(v => ({ ...v, price: Number(v.price) }))
})
