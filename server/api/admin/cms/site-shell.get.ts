import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCmsSiteSettings, listCmsNavigationItems } from '#modula/server/utils/cms'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { getCurrentSiteTemplateKey, listSiteTemplates } from '#modula/server/utils/siteTemplates'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [settings, navigation, featureFlags, currentTemplateKey] = await Promise.all([
    getCmsSiteSettings(),
    listCmsNavigationItems(),
    getFeatureFlags(),
    getCurrentSiteTemplateKey()
  ])

  return {
    settings,
    navigation,
    featureFlags,
    currentTemplateKey,
    siteTemplates: listSiteTemplates()
  }
})
