import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'
import { requireAssociationRolesEnabled } from '~/server/utils/settings'

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
  await requirePermission(event, 'events', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const existing = await prisma.memberRole.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rôle associatif introuvable' })
  }

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

  await prisma.memberRole.update({
    where: { id },
    data: {
      slug,
      name,
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
      color: typeof body.color === 'string' && body.color.trim() ? body.color.trim() : null,
      isDefault: body.isDefault === true
    }
  })

  return { ok: true }
})
