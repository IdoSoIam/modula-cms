import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { applyRegistryTemplate } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template slug' })
  }

  return await applyRegistryTemplate(slug)
})
