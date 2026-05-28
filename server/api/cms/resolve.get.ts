import { resolvePublicCmsPage } from '#modula/server/utils/cms'
import { getFeatureFlags } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const path = typeof query.path === 'string' ? query.path : '/'
  const locale = typeof query.locale === 'string' ? query.locale : 'fr'
  const includeDraft = query.includeDraft === 'true'

  if (!includeDraft) {
    setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  } else {
    setResponseHeader(event, 'Cache-Control', 'no-store')
  }

  const featureFlags = await getFeatureFlags()
  const page = await resolvePublicCmsPage(path, locale, includeDraft, featureFlags)

  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page introuvable'
    })
  }

  return page
})
