import { requireAdmin } from '~/server/utils/requireAdmin'
import { getHomePageContent } from '~/server/utils/homePage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getHomePageContent()
})
