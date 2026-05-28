import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCmsSiteSettings, listCmsNavigationItems } from '#modula/server/utils/cms'
import { getFeatureFlags } from '#modula/server/utils/settings'

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
