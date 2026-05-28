import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteCustomAdminEmailTemplate, findAdminEmailTemplateDefinition } from '#modula/server/utils/adminEmailTemplates'

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

  if (definition.locked || definition.system) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Ce template système ne peut pas être supprimé'
    })
  }

  await deleteCustomAdminEmailTemplate(action)

  return { ok: true }
})
