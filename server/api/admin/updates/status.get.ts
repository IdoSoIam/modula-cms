import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getUpdateAgentStatus, isCmsRegistryConfigured, listRegistryReleases } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  if (!isCmsRegistryConfigured()) {
    return {
      configured: false,
      agentReachable: false,
      currentVersion: null,
      releaseChannel: process.env.CMS_RELEASE_CHANNEL?.trim() || 'stable',
      releases: [],
      jobs: []
    }
  }

  const releaseChannel = process.env.CMS_RELEASE_CHANNEL?.trim() || 'stable'
  const releases = await listRegistryReleases()

  try {
    return {
      configured: true,
      agentReachable: true,
      ...(await getUpdateAgentStatus())
    }
  } catch {
    return {
      configured: true,
      agentReachable: false,
      currentVersion: null,
      releaseChannel,
      releases,
      jobs: []
    }
  }
})
