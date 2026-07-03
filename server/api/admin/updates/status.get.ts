import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getUpdateAgentStatus, isCmsRegistryConfigured, isCmsSystemTemplatesRegistryConfigured, listRegistryReleasesPage } from '#modula/server/utils/cmsRegistry'
import { getSystemInfo } from '#modula/server/utils/systemInfo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const runtimeConfig = useRuntimeConfig(event)
  const runtimeTarget = String(runtimeConfig.public?.cmsRuntimeTarget || runtimeConfig.cmsRuntimeTarget || 'server')
  const updatesEnabled = process.env.NODE_ENV === 'production'
  const updatesDisabledReason = process.env.NODE_ENV !== 'production'
    ? 'development'
    : null
  const systemInfo = await getSystemInfo(runtimeTarget)

  const [customRegistryConfigured, systemRegistryConfigured] = await Promise.all([
    isCmsRegistryConfigured(),
    isCmsSystemTemplatesRegistryConfigured()
  ])
  const registryConfigured = customRegistryConfigured || systemRegistryConfigured

  if (!registryConfigured) {
    return {
      configured: false,
      updatesEnabled,
      updatesDisabledReason,
      systemInfo,
      agentReachable: false,
      currentVersion: systemInfo.appVersion,
      rollbackVersion: null,
      releaseChannel: process.env.CMS_RELEASE_CHANNEL?.trim() || 'stable',
      releases: [],
      releasesPagination: {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      },
      jobs: [],
      rollbackCapabilities: {
        fast: { available: false, reason: 'Registry unavailable' },
        full: { available: false, reason: 'Registry unavailable', warning: null, backupCreatedAt: null }
      },
      jobsPagination: {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      }
    }
  }

  const releaseChannel = process.env.CMS_RELEASE_CHANNEL?.trim() || 'stable'
  const releasesPage = await listRegistryReleasesPage().catch(() => ({
    items: [],
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  }))
  try {
    const agentStatus = updatesEnabled
      ? await getUpdateAgentStatus()
      : {
          currentVersion: systemInfo.appVersion,
          rollbackVersion: null,
          releaseChannel,
          releases: [],
          jobs: [],
          rollbackCapabilities: {
            fast: { available: false, reason: null },
            full: { available: false, reason: null, warning: null, backupCreatedAt: null }
          },
          jobsPagination: {
            items: [],
            total: 0,
            limit: 10,
            offset: 0,
            hasMore: false
          }
        }
    return {
      configured: registryConfigured,
      updatesEnabled,
      updatesDisabledReason,
      systemInfo,
      agentReachable: updatesEnabled,
      ...agentStatus,
      releases: releasesPage.items,
      releasesPagination: releasesPage
    }
  } catch {
    return {
      configured: registryConfigured,
      updatesEnabled,
      updatesDisabledReason,
      systemInfo,
      agentReachable: false,
      currentVersion: systemInfo.appVersion,
      rollbackVersion: null,
      releaseChannel,
      releases: releasesPage.items,
      releasesPagination: releasesPage,
      jobs: [],
      rollbackCapabilities: {
        fast: { available: false, reason: 'Agent unavailable' },
        full: { available: false, reason: 'Agent unavailable', warning: null, backupCreatedAt: null }
      },
      jobsPagination: {
        items: [],
        total: 0,
        limit: 10,
        offset: 0,
        hasMore: false
      }
    }
  }
})
