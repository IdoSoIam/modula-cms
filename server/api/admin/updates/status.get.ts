import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getUpdateAgentStatus, isCmsRegistryConfigured, listRegistryReleasesPage } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (!isCmsRegistryConfigured()) {
    return {
      configured: false,
      agentReachable: false,
      currentVersion: null,
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
    const agentStatus = await getUpdateAgentStatus()
    return {
      configured: true,
      agentReachable: true,
      ...agentStatus,
      releases: releasesPage.items,
      releasesPagination: releasesPage
    }
  } catch {
    return {
      configured: true,
      agentReachable: false,
      currentVersion: null,
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
