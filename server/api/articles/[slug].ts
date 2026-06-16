import { db } from '#modula/server/data/client'
import { getFeatureFlags } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Slug requis' })
  const featureFlags = await getFeatureFlags()
  if (!featureFlags.newsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }
  const article = await db.article.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverUrl: true,
      publishedAt: true,
      published: true
    }
  })
  if (!article || !article.published) {
    throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  }
  return article
})
