import { getRegistryEndpointState, introspectRegistry } from '#modula/server/utils/cmsRegistry'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCmsRegistryInstanceSettings } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [settings, customRegistry, systemRegistry, customCapabilities, systemCapabilities] = await Promise.all([
    getCmsRegistryInstanceSettings(),
    getRegistryEndpointState('custom'),
    getRegistryEndpointState('system'),
    introspectRegistry('custom'),
    introspectRegistry('system')
  ])

  return {
    settings,
    customRegistry,
    systemRegistry,
    capabilities: {
      authenticated: customCapabilities.authenticated || systemCapabilities.authenticated,
      canManageCustomTemplates: customCapabilities.canManageCustomTemplates,
      canManageSystemTemplates: systemCapabilities.canManageSystemTemplates || customCapabilities.canManageSystemTemplates,
      tokenLabel: customCapabilities.tokenLabel || systemCapabilities.tokenLabel || null,
      registryScope: customCapabilities.registryScope || systemCapabilities.registryScope || null
    }
  }
})
