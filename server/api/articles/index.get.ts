import { prisma } from '../../../prisma/client'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { isRuntimeD1Active, listRuntimePublishedArticles } from '#modula/server/platform/runtimeDb'

export default defineEventHandler(async () => {
  const featureFlags = await getFeatureFlags()
  if (!featureFlags.newsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Actualités introuvables' })
  }

  if (isRuntimeD1Active()) {
    return await listRuntimePublishedArticles()
  }

  const items = await prisma.article.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverUrl: true,
      publishedAt: true
    }
  })
  return items
})
