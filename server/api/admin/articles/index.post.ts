import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { slugify } from '#modula/server/utils/slug'
import { db } from '#modula/server/generated/db'

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
  while (await db.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++i}`
  }

  const published = !!body.published
  const article = await db.article.create({
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
