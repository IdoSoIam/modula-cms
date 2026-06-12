import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { canManageSystemRegistryTemplates, publishRegistryTemplateVersion } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const body = await readBody<{ versionId?: string; scope?: 'custom' | 'system' }>(event)

  if (!slug || !body?.versionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing publish parameters' })
  }

  const scope = body.scope === 'system' ? 'system' : 'custom'
  if (scope === 'system' && !canManageSystemRegistryTemplates()) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Cette instance ne peut pas modifier les modèles système.' })
  }

  return await publishRegistryTemplateVersion(slug, body.versionId, scope)
})
