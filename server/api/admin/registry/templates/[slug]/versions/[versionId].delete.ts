import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { canManageSystemRegistryTemplates, deleteRegistryTemplateVersion } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const versionId = getRouterParam(event, 'versionId')
  const query = getQuery(event)

  if (!slug || !versionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template version parameters' })
  }

  const scope = query.scope === 'system' ? 'system' : 'custom'
  if (scope === 'system' && !canManageSystemRegistryTemplates()) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Cette instance ne peut pas modifier les modèles système.' })
  }

  return await deleteRegistryTemplateVersion(slug, versionId, scope)
})
