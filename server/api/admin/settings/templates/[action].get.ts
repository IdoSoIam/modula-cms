import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { findAdminEmailTemplateDefinition, resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'

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

  return {
    action,
    templates: {
      fr: await resolveAdminEmailTemplate(action, 'fr'),
      en: await resolveAdminEmailTemplate(action, 'en')
    }
  }
})
