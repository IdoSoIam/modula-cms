import { requireAdmin } from '~/server/utils/requireAdmin'
import { listCmsPages } from '~/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await listCmsPages()
})
