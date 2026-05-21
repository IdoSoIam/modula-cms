import { requireAdmin } from '~/server/utils/requireAdmin'
import { syncImageUsageTable } from '~/server/utils/imageReferences'
import { slugify } from '~/server/utils/slug'
import { prisma } from '../../../../prisma/client'

interface Body {
  title: string
  excerpt?: string
  content: string
  coverUrl?: string | null
  published?: boolean
  slug?: string
}

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.title?.trim()) throw createError({ statusCode: 400, statusMessage: 'Titre requis' })
  if (!body.content?.trim()) throw createError({ statusCode: 400, statusMessage: 'Contenu requis' })

  const baseSlug = slugify(body.slug || body.title)
  let slug = baseSlug
  let i = 1
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`
  }

  const published = !!body.published
  const article = await prisma.article.create({
    data: {
      title: body.title.trim(),
      slug,
      excerpt: body.excerpt?.trim() || null,
      content: body.content,
      coverUrl: body.coverUrl || null,
      published,
      publishedAt: published ? new Date() : null,
      authorId: user.id
    }
  })
  await syncImageUsageTable()
  return article
})
