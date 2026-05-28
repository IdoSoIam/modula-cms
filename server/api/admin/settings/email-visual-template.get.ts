import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getEmailVisualTemplateConfig } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return {
    config: await getEmailVisualTemplateConfig()
  }
})

