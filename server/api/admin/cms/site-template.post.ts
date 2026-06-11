import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCmsSiteSettings, listCmsNavigationItems } from '#modula/server/utils/cms'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { applySiteTemplate, getCurrentSiteTemplateKey, listSiteTemplates } from '#modula/server/utils/siteTemplates'
import { isCmsSiteTemplateKey } from '#modula/shared/siteTemplates'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ templateKey?: string }>(event)
  if (!isCmsSiteTemplateKey(body?.templateKey)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid template key',
      message: 'Le modèle demandé est invalide.'
    })
  }

  await applySiteTemplate(body.templateKey)

  const [settings, navigation, featureFlags, currentTemplateKey] = await Promise.all([
    getCmsSiteSettings(),
    listCmsNavigationItems(),
    getFeatureFlags(),
    getCurrentSiteTemplateKey()
  ])

  return {
    ok: true,
    settings,
    navigation,
    featureFlags,
    currentTemplateKey,
    siteTemplates: listSiteTemplates()
  }
})
