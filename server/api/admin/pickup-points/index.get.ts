import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return db.pickupPoint.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] })
})
