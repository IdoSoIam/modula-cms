import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getEmailVisualTemplateConfig } from '#modula/server/utils/settings'
import { getAllAdminEmailTemplateDefinitions } from '#modula/server/utils/adminEmailTemplates'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [config, templateDefinitions] = await Promise.all([
    getEmailVisualTemplateConfig(),
    getAllAdminEmailTemplateDefinitions()
  ])
  return { config, templateDefinitions }
})
