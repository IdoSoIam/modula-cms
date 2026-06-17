import { requireAdmin } from '#modula/server/utils/requireAdmin'
import {
  getRegistryEndpointState,
  introspectRegistry,
  isCmsRegistryConfigured,
  isCmsSystemTemplatesRegistryConfigured,
  listManagedRegistryTemplates,
  listMergedSiteTemplates
} from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [customConfigured, systemConfigured, customRegistry, systemRegistry, customCapabilities, systemCapabilities] = await Promise.all([
    isCmsRegistryConfigured(),
    isCmsSystemTemplatesRegistryConfigured(),
    getRegistryEndpointState('custom'),
    getRegistryEndpointState('system'),
    introspectRegistry('custom'),
    introspectRegistry('system')
  ])

  const capabilities = {
    authenticated: customCapabilities.authenticated || systemCapabilities.authenticated,
    canManageCustomTemplates: customCapabilities.canManageCustomTemplates,
    canManageSystemTemplates: systemCapabilities.canManageSystemTemplates || customCapabilities.canManageSystemTemplates,
    tokenLabel: customCapabilities.tokenLabel || systemCapabilities.tokenLabel || null,
    registryScope: customCapabilities.registryScope || systemCapabilities.registryScope || null
  }

  let templates: Awaited<ReturnType<typeof listManagedRegistryTemplates>> = []
  let availableSiteTemplates = await listMergedSiteTemplates().catch(() => [])

  if (customConfigured || systemConfigured) {
    templates = await listManagedRegistryTemplates().catch(() => [])
    if (!availableSiteTemplates.length) {
      availableSiteTemplates = []
    }
  }

  if (!customConfigured && !systemConfigured) {
    return {
      configured: false,
      customRegistry,
      systemRegistry,
      capabilities,
      templates: [],
      availableSiteTemplates
    }
  }

  return {
    configured: true,
    customRegistry,
    systemRegistry,
    capabilities,
    templates,
    availableSiteTemplates
  }
})
