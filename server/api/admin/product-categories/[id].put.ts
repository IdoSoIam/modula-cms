import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { ensureUniqueSlug, serializeProductCategory } from '#modula/server/utils/shop'

interface Body {
  name?: string
  slug?: string
  description?: string | null
  position?: number
  active?: boolean
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const existing = await db.productCategory.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Catégorie introuvable' })
  }

  const body = await readBody<Body>(event)
  const data: Record<string, any> = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.position !== undefined) data.position = Number(body.position || 0)
  if (body.active !== undefined) data.active = body.active
  if (body.slug !== undefined || body.name !== undefined) {
    data.slug = await ensureUniqueSlug('productCategory', body.slug?.trim() || body.name?.trim() || existing.slug, id)
  }

  const row = await db.productCategory.update({
    where: { id },
    data
  })

  return serializeProductCategory(row)
})
