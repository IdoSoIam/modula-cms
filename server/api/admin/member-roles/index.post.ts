import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { requireAssociationRolesEnabled } from '#modula/server/utils/settings'

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export default defineEventHandler(async (event) => {
  await requireAssociationRolesEnabled()
  await requirePermission(event, 'events', 'create')

  const body = await readBody<{
    slug?: string
    name?: string
    description?: string
    color?: string | null
    isDefault?: boolean
  }>(event)

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const slugSource = typeof body.slug === 'string' && body.slug.trim() ? body.slug.trim() : name
  const slug = slugify(slugSource)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug invalide' })
  }

  const created = await db.memberRole.create({
    data: {
      slug,
      name,
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
      color: typeof body.color === 'string' && body.color.trim() ? body.color.trim() : null,
      isDefault: body.isDefault === true,
      isSystem: false
    },
    select: { id: true }
  })

  return created
})
