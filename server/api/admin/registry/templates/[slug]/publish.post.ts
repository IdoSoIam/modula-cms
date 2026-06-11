import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { publishRegistryTemplateVersion } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  const body = await readBody<{ versionId?: string }>(event)

  if (!slug || !body?.versionId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing publish parameters' })
  }

  return await publishRegistryTemplateVersion(slug, body.versionId)
})
