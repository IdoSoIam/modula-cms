import { resolvePublicCmsPage } from '~/server/utils/cms'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = typeof query.path === 'string' ? query.path : '/'
  const locale = typeof query.locale === 'string' ? query.locale : 'fr'
  const includeDraft = query.includeDraft === 'true'

  const page = await resolvePublicCmsPage(path, locale, includeDraft)

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page introuvable'
    })
  }

  return page
})
