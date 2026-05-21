import { requireAdmin } from '~/server/utils/requireAdmin'
import { getPageBuilderContent } from '~/server/utils/pageBuilder'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getPageBuilderContent()
})
