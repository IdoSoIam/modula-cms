import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { listRegistryReleasesPage } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const rawLimit = Number(query.limit || '10')
  const rawOffset = Number(query.offset || '0')
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 10
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0

  return await listRegistryReleasesPage(limit, offset)
})
