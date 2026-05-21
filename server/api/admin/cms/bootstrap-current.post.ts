import { requireAdmin } from '~/server/utils/requireAdmin'
import { bootstrapCmsPageFromResolvedPage } from '~/server/utils/cms'
import type { CmsLocale, ResolvedCmsPage } from '~/shared/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ resolvedPage?: ResolvedCmsPage, locale?: CmsLocale }>(event)

  if (!body?.resolvedPage || !body?.locale) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Page résolue ou locale manquante'
    })
  }

  const page = await bootstrapCmsPageFromResolvedPage(body.resolvedPage, body.locale)
  if (!page) {
    throw createError({
      statusCode: 500,
      statusMessage: "Impossible d'initialiser la page CMS"
    })
  }

  return page
})
