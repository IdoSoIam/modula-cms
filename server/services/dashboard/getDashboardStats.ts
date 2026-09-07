import { db } from '#modula/server/data/client'
import { getGeneratedDatabaseRuntime } from '#modula/server/data/runtime/factory'
import { hasModulePermission } from '#modula/server/utils/permissions'
import { getFeatureFlags } from '#modula/server/utils/settings'
import type { AdminPermissionModule, UserAccessPayload } from '#modula/shared/access'
import { normalizeDistribution, type DashboardStats } from '#modula/shared/dashboard'

export async function getDashboardStats(access: UserAccessPayload): Promise<DashboardStats> {
  const flags = await getFeatureFlags()
  const { adapter } = getGeneratedDatabaseRuntime()
  const canRead = (module: AdminPermissionModule) => hasModulePermission(access, module, 'read')
  const now = new Date()
  const until = new Date(now.getTime() + 30 * 86400000)
  const response: DashboardStats = { generatedAt: now.toISOString(), kpis: [], distributions: [] }
  const tasks: Array<Promise<void>> = []
  // Identifiers are allowlisted; never pass request input into this query.
  const distribution = async (table: 'Event' | 'CmsPage', key: string, statuses: readonly string[]) => {
    const rows = await adapter.query<{ status: string; count: number }>(`SELECT status, COUNT(*) AS count FROM "${table}" GROUP BY status`)
    const items = normalizeDistribution(rows, statuses)
    response.distributions.push({ key, items })
    response.kpis.push({ key, value: items.reduce((sum, item) => sum + item.value, 0) })
  }
  const count = async (key: string, result: Promise<number>) => {
    response.kpis.push({ key, value: Number(await result) })
  }
  if (canRead('cms_pages')) tasks.push(distribution('CmsPage', 'pages', ['DRAFT', 'PUBLISHED']))
  if (flags.eventsEnabled && canRead('events')) {
    tasks.push(distribution('Event', 'events', ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED']))
    // Count event definitions with an upcoming date, not every occurrence of a series.
    tasks.push((async () => {
      const row = await adapter.queryFirst<{ count: number }>(
        `SELECT COUNT(*) AS count FROM "Event" e WHERE e.status = 'PUBLISHED' AND (
          (e.recurrenceType = 'NONE' AND e.startsAt >= ? AND e.startsAt < ?) OR
          (e.recurrenceType = 'WEEKLY' AND EXISTS (
            SELECT 1 FROM "EventOccurrence" o WHERE o.eventId = e.id AND o.status = 'SCHEDULED' AND o.startsAt >= ? AND o.startsAt < ?
          )))`, [now.toISOString(), until.toISOString(), now.toISOString(), until.toISOString()])
      response.kpis.push({ key: 'upcomingEvents', value: Number(row?.count || 0) })
    })())
  }
  if (canRead('themes_images')) tasks.push(count('media', db.image.count()))
  if (canRead('users')) tasks.push(count('users', db.user.count()))
  if (flags.newsEnabled && canRead('news')) tasks.push(count('articles', db.article.count()))
  if (flags.shop.enabled && canRead('shop_orders')) {
    tasks.push((async () => {
      const row = await adapter.queryFirst<{ pending: number; paid: number; cancelled: number }>(
        `SELECT COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0) AS pending,
          COALESCE(SUM(CASE WHEN paymentStatus = 'PAID' THEN 1 ELSE 0 END), 0) AS paid,
          COALESCE(SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END), 0) AS cancelled FROM "ShopOrder"`)
      response.kpis.push({ key: 'pendingOrders', value: Number(row?.pending || 0) }, { key: 'paidOrders', value: Number(row?.paid || 0) }, { key: 'cancelledOrders', value: Number(row?.cancelled || 0) })
    })())
    tasks.push(count('activeProducts', db.product.count({ where: { active: true } })))
  }
  await Promise.all(tasks)
  const order = ['pages', 'events', 'upcomingEvents', 'articles', 'media', 'users', 'activeProducts', 'pendingOrders', 'paidOrders', 'cancelledOrders']
  response.kpis.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key))
  response.distributions.sort((a, b) => a.key.localeCompare(b.key))
  return response
}
