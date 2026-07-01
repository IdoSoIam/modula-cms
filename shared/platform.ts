export type CmsDbDriver = 'd1' | 'sqlite' | 'mysql' | 'postgres'
export type CmsStorageDriver = 'fs' | 'r2' | 's3'
export type CmsRuntimeTarget = 'cloudflare' | 'server'

export interface CmsProjectModulesConfig {
  cms: boolean
  news: boolean
  planning: boolean
  events: boolean
  shop: boolean
  associationRoles: boolean
}

export interface CmsProjectSiteConfig {
  key: string
  displayName: string
  defaultLocale: 'fr' | 'en'
  publicUrl: string
  tagline: {
    fr: string
    en: string
  }
  defaultPlaceName: string
  defaultVolunteerPlaceName: string
  defaultPlaceCity: string
  defaultFarmPickupAddress: string
}

export interface CmsProjectPlatformConfig {
  runtimeTarget: CmsRuntimeTarget
  dbDriver: CmsDbDriver
  storageDriver: CmsStorageDriver
}

export interface CmsProjectStorageConfig {
  filesystemDir: string
  publicUploadsPath: string
}

export interface CmsProjectSeedConfig {
  defaultSiteName: {
    fr: string
    en: string
  }
  defaultSiteTagline: {
    fr: string
    en: string
  }
}

export interface CmsProjectConfig {
  site: CmsProjectSiteConfig
  platform: CmsProjectPlatformConfig
  storage: CmsProjectStorageConfig
  modules: CmsProjectModulesConfig
  seed: CmsProjectSeedConfig
}

export interface ResolvedCmsPlatformConfig {
  runtimeTarget: CmsRuntimeTarget
  dbDriver: CmsDbDriver
  storageDriver: CmsStorageDriver
  filesystemDir: string
  publicUploadsPath: string
  imageDeliveryMode: 'worker' | 'ipx'
  siteUrl: string
  imageCloudflareBaseURL: string
  imageSourceBaseURL: string
}

export function defineCmsProjectConfig(config: CmsProjectConfig) {
  return config
}

export function mergeCmsProjectConfig(base: CmsProjectConfig, override?: CmsProjectConfig | null): CmsProjectConfig {
  if (!override) {
    return base
  }

  return {
    site: {
      ...base.site,
      ...override.site,
      tagline: {
        ...base.site.tagline,
        ...override.site?.tagline
      }
    },
    platform: {
      ...base.platform,
      ...override.platform
    },
    storage: {
      ...base.storage,
      ...override.storage
    },
    modules: {
      ...base.modules,
      ...override.modules
    },
    seed: {
      ...base.seed,
      ...override.seed,
      defaultSiteName: {
        ...base.seed.defaultSiteName,
        ...override.seed?.defaultSiteName
      },
      defaultSiteTagline: {
        ...base.seed.defaultSiteTagline,
        ...override.seed?.defaultSiteTagline
      }
    }
  }
}

export function parseCmsProjectConfigJson(value: string | undefined | null): CmsProjectConfig | null {
  if (!value || !value.trim()) return null

  try {
    return JSON.parse(value) as CmsProjectConfig
  } catch {
    return null
  }
}

export function normalizeCmsDbDriver(value: string | undefined | null): CmsDbDriver | null {
  switch ((value || '').trim().toLowerCase()) {
    case 'd1':
      return 'd1'
    case 'sqlite':
      return 'sqlite'
    case 'mysql':
      return 'mysql'
    case 'postgres':
    case 'postgresql':
      return 'postgres'
    default:
      return null
  }
}

export function normalizeCmsStorageDriver(value: string | undefined | null): CmsStorageDriver | null {
  switch ((value || '').trim().toLowerCase()) {
    case 'fs':
    case 'filesystem':
    case 'local':
      return 'fs'
    case 'r2':
      return 'r2'
    case 's3':
    case 's3-compatible':
      return 's3'
    default:
      return null
  }
}

export function normalizeCmsRuntimeTarget(value: string | undefined | null): CmsRuntimeTarget | null {
  switch ((value || '').trim().toLowerCase()) {
    case 'cloudflare':
    case 'worker':
    case 'workers':
      return 'cloudflare'
    case 'server':
    case 'node':
    case 'node_server':
      return 'server'
    default:
      return null
  }
}

export function inferCmsRuntimeTargetFromDrivers(dbDriver: CmsDbDriver): CmsRuntimeTarget {
  return dbDriver === 'd1' ? 'cloudflare' : 'server'
}

export function resolveCmsPlatformConfig(env: Record<string, string | undefined>, project: CmsProjectConfig): ResolvedCmsPlatformConfig {
  const dbDriver = normalizeCmsDbDriver(env.CMS_DB_DRIVER) || project.platform.dbDriver
  const storageDriver = normalizeCmsStorageDriver(env.CMS_STORAGE_DRIVER || env.IMAGE_STORAGE_DRIVER) || project.platform.storageDriver
  const runtimeTarget = normalizeCmsRuntimeTarget(env.CMS_RUNTIME_TARGET) || project.platform.runtimeTarget || inferCmsRuntimeTargetFromDrivers(dbDriver)
  const filesystemDir = (env.CMS_FILESYSTEM_STORAGE_DIR || env.IMAGE_FILESYSTEM_DIR || project.storage.filesystemDir || 'public/uploads').trim()
  const publicUploadsPath = (env.CMS_PUBLIC_UPLOADS_PATH || project.storage.publicUploadsPath || '/uploads').trim()
  const siteUrl = env.SITE_URL || project.site.publicUrl || '/'
  const imageCloudflareBaseURL = env.IMAGE_CLOUDFLARE_BASE_URL || siteUrl
  const imageSourceBaseURL = env.IMAGE_SOURCE_BASE_URL || imageCloudflareBaseURL
  const imageDeliveryMode = ((env.IMAGE_DELIVERY_MODE || '').trim().toLowerCase() === 'worker'
    ? 'worker'
    : (runtimeTarget === 'cloudflare' && storageDriver === 'r2' ? 'worker' : 'ipx'))

  return {
    runtimeTarget,
    dbDriver,
    storageDriver,
    filesystemDir,
    publicUploadsPath,
    imageDeliveryMode,
    siteUrl,
    imageCloudflareBaseURL,
    imageSourceBaseURL
  }
}
