import type { CmsLocalizedText, CmsNavigationItemPayload, CmsPagePayload, CmsSiteSettings } from '#modula/shared/cms'
import type { DaisyUiThemeConfig } from '#modula/shared/themes'

export interface CmsRegistryFeatureFlags {
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  shop: {
    enabled: boolean
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
  publicUrl?: string
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

export interface CmsRegistryCapabilities {
  authenticated: boolean
  canManageSystemTemplates: boolean
  canManageCustomTemplates: boolean
  tokenLabel?: string | null
  registryScope?: 'system' | 'custom' | 'shared' | null
}

export interface CmsRegistryEndpointState {
  url: string
  configured: boolean
  reachable: boolean
  error: string | null
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
  payment?: CmsRegistryPaymentConfig
}

export interface CmsRegistryPaymentConfig {
  provider: 'none' | 'stripe_connect'
  configured: boolean
  connectedAccountId: string
  connectedAccountLabel: string
  commissionPercent: number
  automaticTaxEnabled: boolean
  defaultTaxBehavior: 'inclusive' | 'exclusive'
  defaultTaxCode: string
  publishableKey: string
}

export interface CmsRegistryPaymentLineItem {
  name: string
  amount: number
  quantity?: number
  currency?: string
  description?: string
  imageUrl?: string
  taxBehavior?: 'inclusive' | 'exclusive'
  taxCode?: string
}

export interface CmsRegistryPaymentRecord {
  id: string
  instanceSlug: string
  orderId: string
  orderNumber: string | null
  provider: string
  providerAccountId: string | null
  providerSessionId: string | null
  providerPaymentIntentId: string | null
  providerPaymentStatus: string | null
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  checkoutUrl: string | null
  amountTotal: number
  currency: string
  commissionAmount: number
  commissionPercent: number
  customerEmail: string | null
  successUrl: string | null
  cancelUrl: string | null
  metadata: Record<string, any>
  lastEventId: string | null
  failureReason: string | null
  createdAt: string
  updatedAt: string
}

export interface CmsRegistryTranslationRequestItem {
  text: string
  sourceLocale: string
  targetLocale: string
}

export interface CmsRegistryTranslationResultItem {
  sourceLocale: string
  targetLocale: string
  sourceText: string
  translatedText: string
  cached: boolean
}

export interface CmsRegistryTranslationBatchResult {
  items: CmsRegistryTranslationResultItem[]
  translated: number
  cached: number
}
