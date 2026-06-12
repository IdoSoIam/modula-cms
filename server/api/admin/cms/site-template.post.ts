import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCmsSiteSettings, listCmsNavigationItems } from '#modula/server/utils/cms'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { applySiteTemplate, getCurrentSiteTemplateKey, listSiteTemplates } from '#modula/server/utils/siteTemplates'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ templateKey?: string }>(event)
  if (!body?.templateKey?.trim()) {
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
    siteTemplates: await listSiteTemplates()
  }
})
