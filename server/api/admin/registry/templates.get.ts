import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { canManageSystemRegistryTemplates, isCmsRegistryConfigured, listManagedRegistryTemplates, listMergedSiteTemplates } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (!isCmsRegistryConfigured()) {
    return {
      configured: false,
      canManageSystemTemplates: canManageSystemRegistryTemplates(),
      templates: []
    }
  }

  return {
    configured: true,
    canManageSystemTemplates: canManageSystemRegistryTemplates(),
    templates: await listManagedRegistryTemplates(),
    availableSiteTemplates: await listMergedSiteTemplates()
  }
})
