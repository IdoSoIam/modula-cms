import { prisma } from '../../../prisma/client'

export default defineEventHandler(async () => {
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
