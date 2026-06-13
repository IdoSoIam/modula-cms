import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { isRuntimeD1Active, listRuntimeArticles } from '#modula/server/platform/runtimeDb'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (isRuntimeD1Active()) {
    const items = await listRuntimeArticles()
    return items.map((item) => ({
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      coverUrl: item.coverUrl,
      published: Boolean(item.published),
      publishedAt: item.publishedAt,
      authorId: item.authorId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      author: item.authorId ? {
        id: item.authorId,
        firstName: item.authorFirstName,
        lastName: item.authorLastName,
        email: item.authorEmail
      } : null
    }))
  }

  const items = await prisma.article.findMany({
    orderBy: [{ updatedAt: 'desc' }],
    include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } }
  })
  return items
})
