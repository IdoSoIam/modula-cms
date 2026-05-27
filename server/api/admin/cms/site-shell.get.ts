import { requireAdmin } from '~/server/utils/requireAdmin'
import { getCmsSiteSettings, listCmsNavigationItems } from '~/server/utils/cms'
import { getFeatureFlags } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [settings, navigation, featureFlags] = await Promise.all([
    getCmsSiteSettings(),
    listCmsNavigationItems(),
    getFeatureFlags()
  ])

  return {
    settings,
    navigation,
    featureFlags
  }
})
