import { getRegistryEndpointState, introspectRegistry } from '#modula/server/utils/cmsRegistry'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { saveCmsRegistryInstanceSettings } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ registryUrl?: string, registryApiKey?: string }>(event)

  await saveCmsRegistryInstanceSettings({
    registryUrl: body?.registryUrl?.trim() || '',
    registryApiKey: body?.registryApiKey?.trim() || ''
  })

  const [customRegistry, systemRegistry, customCapabilities, systemCapabilities] = await Promise.all([
    getRegistryEndpointState('custom'),
    getRegistryEndpointState('system'),
    introspectRegistry('custom'),
    introspectRegistry('system')
  ])

  return {
    ok: true,
    settings: {
      registryUrl: body?.registryUrl?.trim() || '',
      registryApiKey: body?.registryApiKey?.trim() || ''
    },
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
