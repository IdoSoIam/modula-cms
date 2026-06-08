import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { isCmsRegistryConfigured, listRegistryTemplates } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (!isCmsRegistryConfigured()) {
    return {
      configured: false,
      templates: []
    }
  }

  return {
    configured: true,
    templates: await listRegistryTemplates()
  }
})
