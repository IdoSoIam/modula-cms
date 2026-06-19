import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { ensureUniqueSlug, serializeProductCategory } from '#modula/server/utils/shop'

interface Body {
  name: string
  slug?: string
  description?: string | null
  position?: number
  active?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const slug = await ensureUniqueSlug('productCategory', body.slug?.trim() || body.name.trim())
  const row = await db.productCategory.create({
    data: {
      name: body.name.trim(),
      slug,
      description: body.description?.trim() || null,
      position: Number(body.position || 0),
      active: body.active ?? true
    }
  })

  return serializeProductCategory(row)
})
