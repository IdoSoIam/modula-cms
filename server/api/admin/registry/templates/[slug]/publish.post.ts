import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { introspectRegistry, publishRegistryTemplateVersion } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const body = await readBody<{ versionId?: string; scope?: 'custom' | 'system' }>(event)

  if (!slug || !body?.versionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing publish parameters' })
  }

  const scope = body.scope === 'system' ? 'system' : 'custom'
  const capabilities = await introspectRegistry(scope)
  if (scope === 'system' && !capabilities.canManageSystemTemplates) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'La clé configurée ne peut pas modifier les modèles système.' })
  }
  if (scope === 'custom' && !capabilities.canManageCustomTemplates) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'La clé configurée ne peut pas modifier les modèles personnalisés.' })
  }

  return await publishRegistryTemplateVersion(slug, body.versionId, scope)
})
