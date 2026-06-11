import type { CmsLocalizedText, CmsNavigationItemPayload, CmsPagePayload, CmsSiteSettings } from '#modula/shared/cms'
import type { DaisyUiThemeConfig } from '#modula/shared/themes'

export interface CmsRegistryFeatureFlags {
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  shop: {
    enabled: boolean
    basketsEnabled: boolean
    vegetablesEnabled: boolean
  }
  associationRolesEnabled: boolean
  eventsEnabled: boolean
  newsEnabled: boolean
}

export interface CmsRegistryAssetReference {
  id: string
  filename: string
  contentType: string
  size: number
  checksum: string
  storageKey: string
  downloadUrl: string
  sourceUrl: string
}

export interface CmsRegistryTemplateSnapshot {
  siteSettings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
  pages: CmsPagePayload[]
  themeConfig: DaisyUiThemeConfig
  featureFlags: CmsRegistryFeatureFlags
  assetManifest: CmsRegistryAssetReference[]
}

export interface CmsRegistryTemplateVersionSummary {
  id: string
  versionNumber: number
  status: 'draft' | 'published' | 'archived'
  createdAt: string
}

export interface CmsRegistryTemplateRecord {
  id: string
  slug: string
  label: CmsLocalizedText
  description: CmsLocalizedText
  icon: string
  previewImage: string
  highlights: CmsLocalizedText[]
  themeNames: string[]
  sourceType: 'system' | 'custom'
  deletedAt: string | null
  currentVersionId: string | null
  currentVersionNumber: number | null
  snapshot?: CmsRegistryTemplateSnapshot | null
  versions?: CmsRegistryTemplateVersionSummary[]
}

export interface CmsRegistryReleaseRecord {
  id: string
  version: string
  channel: string
  checksum: string
  artifactKey: string
  artifactUrl: string
  manifest: Record<string, any>
  createdAt: string
}

export interface CmsRegistryDeploymentLog {
  id: string
  deploymentId: string
  level: 'info' | 'error'
  message: string
  createdAt: string
}

export interface CmsRegistryDeploymentJob {
  id: string
  instanceSlug: string
  version: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back'
  createdAt: string
  updatedAt: string
  logs: CmsRegistryDeploymentLog[]
  metadata?: {
    progressPercent?: number
    currentStep?: string
    rollbackVersion?: string | null
    previousVersion?: string | null
    restoredVersion?: string | null
    rollbackStrategy?: 'fast' | 'full' | null
    schemaCompatibleRollback?: boolean
    databaseBackup?: {
      path: string
      createdAt: string
      previousVersion: string | null
      targetVersion: string | null
    } | null
    manifest?: Record<string, any>
    currentDir?: string
    releaseDir?: string
    mode?: 'deploy' | 'rollback'
    [key: string]: any
  } | null
}

export interface CmsRegistryRollbackCapabilities {
  fast: {
    available: boolean
    reason?: string | null
  }
  full: {
    available: boolean
    reason?: string | null
    warning?: string | null
    backupCreatedAt?: string | null
  }
}

export interface CmsRegistryPaginatedResult<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export interface CmsRegistryInstanceRecord {
  id: string
  slug: string
  name: string
  environment: string
  releaseChannel: string
  currentVersion: string | null
  lastSeenAt: string | null
}
