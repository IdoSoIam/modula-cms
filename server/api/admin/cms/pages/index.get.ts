import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { listCmsPages } from '#modula/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await listCmsPages()
})
