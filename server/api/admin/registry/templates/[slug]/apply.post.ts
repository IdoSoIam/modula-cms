import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { applySiteTemplate } from '#modula/server/utils/siteTemplates'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template slug' })
  }

  await applySiteTemplate(slug)
  return { ok: true, currentTemplateKey: slug }
})
