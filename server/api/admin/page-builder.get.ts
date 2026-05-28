import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getPageBuilderContent } from '#modula/server/utils/pageBuilder'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getPageBuilderContent()
})
