import { requireAdmin } from '~/server/utils/requireAdmin'
import { syncImageUsageTable } from '~/server/utils/imageReferences'
import { slugify } from '~/server/utils/slug'
import { prisma } from '../../../../prisma/client'

interface Body {
  title?: string
  excerpt?: string | null
  content?: string
  coverUrl?: string | null
  published?: boolean
  slug?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const existing = await prisma.article.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })

  const body = await readBody<Body>(event)
  const data: any = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.excerpt !== undefined) data.excerpt = body.excerpt?.trim() || null
  if (body.content !== undefined) data.content = body.content
  if (body.coverUrl !== undefined) data.coverUrl = body.coverUrl || null

  if (body.slug !== undefined && body.slug !== existing.slug) {
    const baseSlug = slugify(body.slug)
    let slug = baseSlug
    let i = 1
    while (await prisma.article.findFirst({ where: { slug, NOT: { id } } })) {
      slug = `${baseSlug}-${++i}`
    }
    data.slug = slug
  }

  if (body.published !== undefined && body.published !== existing.published) {
    data.published = body.published
    data.publishedAt = body.published ? (existing.publishedAt ?? new Date()) : existing.publishedAt
  }

  const article = await prisma.article.update({ where: { id }, data })
  await syncImageUsageTable()
  return article
})
