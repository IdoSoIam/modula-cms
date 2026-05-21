import { requireAdmin } from '~/server/utils/requireAdmin'
import { getCmsSiteSettings, listCmsNavigationItems } from '~/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [settings, navigation] = await Promise.all([
    getCmsSiteSettings(),
    listCmsNavigationItems()
  ])

  return {
    settings,
    navigation
  }
})
