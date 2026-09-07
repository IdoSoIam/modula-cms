import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getDashboardStats } from '#modula/server/services/dashboard/getDashboardStats'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return getDashboardStats(user.access)
})
