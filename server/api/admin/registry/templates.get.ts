import { requireAdmin } from '#modula/server/utils/requireAdmin'
import {
  canManageSystemRegistryTemplates,
  isCmsRegistryConfigured,
  isCmsSystemTemplatesRegistryConfigured,
  listManagedRegistryTemplates,
  listMergedSiteTemplates
} from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (!isCmsRegistryConfigured() && !isCmsSystemTemplatesRegistryConfigured()) {
    return {
      configured: false,
      canManageSystemTemplates: canManageSystemRegistryTemplates(),
      templates: [],
      availableSiteTemplates: await listMergedSiteTemplates()
    }
  }

  return {
    configured: true,
    canManageSystemTemplates: canManageSystemRegistryTemplates(),
    templates: await listManagedRegistryTemplates(),
    availableSiteTemplates: await listMergedSiteTemplates()
  }
})
