import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { findAdminEmailTemplateDefinition, resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'
import { getSiteLocales } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const action = getRouterParam(event, 'action')
  const definition = action ? await findAdminEmailTemplateDefinition(action) : null

  if (!action || !definition) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template introuvable'
    })
  }

  const locales = await getSiteLocales().catch(() => ['fr', 'en'])
  const templates = Object.fromEntries(
    await Promise.all(locales.map(async (locale) => [locale, await resolveAdminEmailTemplate(action, locale)] as const))
  )

  return {
    action,
    templates
  }
})
