import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteRegistryTemplateVersion, introspectRegistry } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const versionId = getRouterParam(event, 'versionId')
  const query = getQuery(event)

  if (!slug || !versionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template version parameters' })
  }

  const scope = query.scope === 'system' ? 'system' : 'custom'
  const capabilities = await introspectRegistry(scope)
  if (scope === 'system' && !capabilities.canManageSystemTemplates) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'La clé configurée ne peut pas modifier les modèles système.' })
  }
  if (scope === 'custom' && !capabilities.canManageCustomTemplates) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'La clé configurée ne peut pas modifier les modèles personnalisés.' })
  }

  return await deleteRegistryTemplateVersion(slug, versionId, scope)
})
