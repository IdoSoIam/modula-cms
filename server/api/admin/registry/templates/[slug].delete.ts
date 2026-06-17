import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteRegistryTemplate, introspectRegistry } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template slug' })
  }

  const scope = query.scope === 'system' ? 'system' : 'custom'
  const capabilities = await introspectRegistry(scope)
  if (scope === 'system' && !capabilities.canManageSystemTemplates) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'La clé configurée ne peut pas modifier les modèles système.' })
  }
  if (scope === 'custom' && !capabilities.canManageCustomTemplates) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'La clé configurée ne peut pas modifier les modèles personnalisés.' })
  }

  return await deleteRegistryTemplate(slug, scope)
})
