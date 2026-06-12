import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getUpdateAgentStatus, isCmsRegistryConfigured, listRegistryReleasesPage } from '#modula/server/utils/cmsRegistry'

async function readJsonFile(filePath: string) {
  const { readFile } = await import('node:fs/promises')
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function resolvePackageVersion(packageName: string) {
  const { existsSync } = await import('node:fs')
  const path = await import('node:path')
  const filePath = path.resolve(process.cwd(), 'node_modules', packageName, 'package.json')
  if (!existsSync(filePath)) return null
  try {
    const pkg = await readJsonFile(filePath) as { version?: string }
    return pkg.version || null
  } catch {
    return null
  }
}

async function resolveNpmVersion() {
  const userAgent = process.env.npm_config_user_agent || ''
  const match = userAgent.match(/npm\/([^\s]+)/i)
  if (match?.[1]) return match[1]
  return null
}

async function getSystemInfo(runtimeTarget: string) {
  const { existsSync } = await import('node:fs')
  const path = await import('node:path')
  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  let appVersion: string | null = null
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = await readJsonFile(packageJsonPath) as { version?: string }
      appVersion = pkg.version || null
    } catch {}
  }

  const info = {
    appVersion,
    runtimeTarget,
    nodeVersion: typeof process !== 'undefined' ? process.version : null,
    npmVersion: await resolveNpmVersion(),
    nuxtVersion: await resolvePackageVersion('nuxt'),
    nitroVersion: await resolvePackageVersion('nitropack'),
    platform: null as string | null,
    architecture: null as string | null,
    hostname: null as string | null,
    totalMemoryMb: null as number | null,
    freeMemoryMb: null as number | null
  }

  if (runtimeTarget === 'cloudflare') {
    return info
  }

  try {
    const os = await import('node:os')
    info.platform = `${os.platform()} ${os.release()}`
    info.architecture = os.arch()
    info.hostname = os.hostname()
    info.totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024)
    info.freeMemoryMb = Math.round(os.freemem() / 1024 / 1024)
  } catch {}

  return info
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const runtimeConfig = useRuntimeConfig(event)
  const runtimeTarget = String(runtimeConfig.public?.cmsRuntimeTarget || runtimeConfig.cmsRuntimeTarget || 'server')
  const updatesEnabled = process.env.NODE_ENV === 'production' && runtimeTarget !== 'cloudflare'
  const updatesDisabledReason = process.env.NODE_ENV !== 'production'
    ? 'development'
    : runtimeTarget === 'cloudflare'
      ? 'cloudflare'
      : null
  const systemInfo = await getSystemInfo(runtimeTarget)

  if (!isCmsRegistryConfigured()) {
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
      configured: true,
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
      configured: true,
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
