import { prisma } from '../../../prisma/client'
import { getFeatureFlags } from '~/server/utils/settings'

export default defineEventHandler(async () => {
  const featureFlags = await getFeatureFlags()
  if (!featureFlags.newsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Actualités introuvables' })
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
