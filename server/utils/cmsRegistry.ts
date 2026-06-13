import { createHash } from 'node:crypto'
import { basename, extname } from 'node:path'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { getCmsPageByPath, getCmsSiteSettings, listCmsNavigationItems, listCmsPages, saveCmsNavigationItems, saveCmsPage, saveCmsSiteSettings } from '#modula/server/utils/cms'
import { getFeatureFlags, setSetting, SETTING_KEYS } from '#modula/server/utils/settings'
import { getDaisyUiThemeConfig, saveDaisyUiThemeConfig } from '#modula/server/utils/themes'
import { getUploadObject, putUploadObject } from '#modula/server/utils/uploadStorage'
import type {
  CmsRegistryAssetReference,
  CmsRegistryDeploymentJob,
  CmsRegistryInstanceRecord,
  CmsRegistryPaginatedResult,
  CmsRegistryRollbackCapabilities,
  CmsRegistryReleaseRecord,
  CmsRegistryTemplateRecord,
  CmsRegistryTemplateSnapshot
} from '#modula/shared/registry'
import type { CmsLocalizedText, CmsPagePayload } from '#modula/shared/cms'
import { FALLBACK_SITE_TEMPLATE, type CmsSiteTemplateDefinition } from '#modula/shared/siteTemplates'

type RegistryFetchOptions = {
  method?: string
  body?: any
  headers?: Record<string, string>
}

type RegistryScope = 'custom' | 'system'

function getRegistryConfig(scope: RegistryScope = 'custom') {
  const customUrl = process.env.CMS_REGISTRY_URL?.trim() || ''
  const customApiKey = process.env.CMS_REGISTRY_API_KEY?.trim() || ''
  const customInstanceSlug = process.env.CMS_INSTANCE_SLUG?.trim() || ''
  const systemUrl = process.env.CMS_SYSTEM_TEMPLATES_REGISTRY_URL?.trim() || customUrl
  const systemApiKey = process.env.CMS_SYSTEM_TEMPLATES_REGISTRY_API_KEY?.trim() || customApiKey
  const systemInstanceSlug = process.env.CMS_SYSTEM_TEMPLATES_INSTANCE_SLUG?.trim() || customInstanceSlug

  const current = scope === 'system'
    ? { url: systemUrl, apiKey: systemApiKey, instanceSlug: systemInstanceSlug }
    : { url: customUrl, apiKey: customApiKey, instanceSlug: customInstanceSlug }

  return {
    ...current,
    releaseChannel: process.env.CMS_RELEASE_CHANNEL?.trim() || 'stable'
  }
}

export function isCmsRegistryConfigured() {
  const config = getRegistryConfig('custom')
  return Boolean(config.url && config.apiKey && config.instanceSlug)
}

export function isCmsSystemTemplatesRegistryConfigured() {
  const config = getRegistryConfig('system')
  return Boolean(config.url && config.apiKey)
}

export function canManageSystemRegistryTemplates() {
  return process.env.CMS_CAN_MANAGE_SYSTEM_TEMPLATES === 'true'
}

export function getCmsUpdateAgentConfig() {
  const registry = getRegistryConfig()
  return {
    url: 'http://127.0.0.1:4401',
    token: registry.apiKey || registry.instanceSlug || 'modula-cms-local'
  }
}

export function isCmsUpdateAgentConfigured() {
  return isCmsRegistryConfigured()
}

async function registryFetch<T>(path: string, options: RegistryFetchOptions = {}, scope: RegistryScope = 'custom'): Promise<T> {
  const config = getRegistryConfig(scope)
  if (!config.url || !config.apiKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'CMS registry unavailable',
      message: 'Le registre CMS n’est pas configuré sur cette instance.'
    })
  }

  const response = await fetch(`${config.url.replace(/\/$/, '')}${path}`, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.apiKey}`,
      'x-instance-slug': config.instanceSlug,
      ...options.headers
    },
    body: options.body == null ? undefined : JSON.stringify(options.body)
  })

  if (!response.ok) {
    let message = `Registry request failed with ${response.status}`
    try {
      const data = await response.json() as { message?: string }
      if (data?.message) message = data.message
    } catch {}
    throw createError({
      statusCode: response.status,
      statusMessage: 'CMS registry request failed',
      message
    })
  }

  if (response.status === 204) {
    return undefined as T
  }

  return await response.json() as T
}

async function registryUploadAsset(filename: string, contentType: string, bytes: Uint8Array, sourceUrl: string) {
  const checksum = createHash('sha256').update(bytes).digest('hex')
  return await registryFetch<CmsRegistryAssetReference>('/v1/template-assets', {
    method: 'POST',
    body: {
      filename,
      contentType,
      dataBase64: Buffer.from(bytes).toString('base64'),
      checksum,
      sourceUrl
    }
  })
}

function collectStringUrls(value: unknown, collected = new Set<string>()) {
  if (typeof value === 'string') {
    if (value.startsWith('/uploads/') || value.startsWith('/site-templates/')) {
      collected.add(value)
    }
    return collected
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStringUrls(item, collected)
    return collected
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStringUrls(item, collected)
  }
  return collected
}

async function readBundledAsset(url: string) {
  const filename = basename(url)
  const sourcePath = resolveBundledAssetPath(url)
  const bytes = await readFile(sourcePath)
  return {
    filename,
    bytes: new Uint8Array(bytes),
    contentType: url.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'
  }
}

function resolveBundledAssetPath(url: string) {
  const normalized = url.replace(/^\//, '').replace(/\//g, path.sep)
  const candidates = [
    path.resolve(process.cwd(), 'public', normalized),
    path.resolve(process.cwd(), '.output', 'public', normalized)
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

export async function exportTemplateAssets(snapshotSource: Omit<CmsRegistryTemplateSnapshot, 'assetManifest'>) {
  const urls = [...collectStringUrls(snapshotSource)]
  const manifest: CmsRegistryAssetReference[] = []

  for (const url of urls) {
    try {
      if (url.startsWith('/uploads/')) {
        const key = url.replace(/^\/uploads\//, '')
        const object = await getUploadObject(key)
        if (!object?.body) continue
        const bytes = object.body instanceof Uint8Array ? object.body : new Uint8Array(await object.body.arrayBuffer())
        const asset = await registryUploadAsset(key, object.contentType || 'application/octet-stream', bytes, url)
        manifest.push(asset)
        continue
      }

      if (url.startsWith('/site-templates/')) {
        const asset = await readBundledAsset(url)
        manifest.push(await registryUploadAsset(asset.filename, asset.contentType, asset.bytes, url))
      }
    } catch {
      continue
    }
  }

  return manifest
}

export async function exportCurrentTemplateSnapshot(): Promise<CmsRegistryTemplateSnapshot> {
  const [siteSettings, navigation, pages, themeConfig, featureFlags] = await Promise.all([
    getCmsSiteSettings(),
    listCmsNavigationItems(),
    listCmsPages(),
    getDaisyUiThemeConfig(),
    getFeatureFlags()
  ])

  const pagesPayload = pages.map((page) => ({
    path: page.path,
    slug: page.slug,
    pageType: page.pageType,
    status: page.status,
    specialRole: page.specialRole,
    templateKey: page.templateKey,
    rendererKey: page.rendererKey,
    applicationPosition: page.applicationPosition,
    title: page.title,
    translations: page.translations
  })) as CmsPagePayload[]

  const partialSnapshot = {
    siteSettings,
    navigation,
    pages: pagesPayload,
    themeConfig,
    featureFlags
  }

  const assetManifest = await exportTemplateAssets(partialSnapshot)
  return {
    ...partialSnapshot,
    assetManifest
  }
}

function resolveSnapshotAssetUrl(value: string, assets: CmsRegistryAssetReference[]) {
  const matched = assets.find(asset => asset.sourceUrl === value)
  if (!matched) return value
  return matched.downloadUrl
}

function rewriteSnapshotAssetUrls<T>(value: T, assets: CmsRegistryAssetReference[]): T {
  if (typeof value === 'string') {
    return resolveSnapshotAssetUrl(value, assets) as T
  }
  if (Array.isArray(value)) {
    return value.map(item => rewriteSnapshotAssetUrls(item, assets)) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, rewriteSnapshotAssetUrls(item, assets)])
    ) as T
  }
  return value
}

async function importRegistryAsset(asset: CmsRegistryAssetReference) {
  if (asset.sourceUrl.startsWith('/site-templates/')) {
    return asset.downloadUrl
  }

  const config = getRegistryConfig()
  const response = await fetch(asset.downloadUrl, {
    headers: {
      authorization: `Bearer ${config.apiKey}`
    }
  })
  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Template asset download failed',
      message: `Impossible de télécharger l’asset ${asset.filename} depuis le registre.`
    })
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  const targetName = `${asset.id}${extname(asset.filename) || ''}`
  await putUploadObject(targetName, bytes, asset.contentType)
  return `/uploads/${targetName}`
}

async function materializeSnapshotAssets(snapshot: CmsRegistryTemplateSnapshot) {
  const assetUrlMap = new Map<string, string>()
  for (const asset of snapshot.assetManifest) {
    assetUrlMap.set(asset.downloadUrl, await importRegistryAsset(asset))
  }

  const rewriteDownloadedUrls = <T>(value: T): T => {
    if (typeof value === 'string') {
      return (assetUrlMap.get(value) || value) as T
    }
    if (Array.isArray(value)) {
      return value.map(item => rewriteDownloadedUrls(item)) as T
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, rewriteDownloadedUrls(item)])
      ) as T
    }
    return value
  }

  return rewriteDownloadedUrls(snapshot)
}

export async function importTemplateSnapshot(snapshot: CmsRegistryTemplateSnapshot) {
  const prepared = await materializeSnapshotAssets(snapshot)
  await saveCmsSiteSettings(prepared.siteSettings)
  await saveCmsNavigationItems(prepared.navigation)
  await saveDaisyUiThemeConfig(prepared.themeConfig)
  for (const page of prepared.pages) {
    const existing = await getCmsPageByPath(page.path)
    await saveCmsPage(existing?.id ?? null, page)
  }
  await Promise.all([
    setSetting(SETTING_KEYS.IN_DEVELOPMENT, prepared.featureFlags.inDevelopment ? 'true' : 'false'),
    setSetting(SETTING_KEYS.REGISTER_ENABLED, prepared.featureFlags.registerEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.SUBSCRIPTIONS_ENABLED, prepared.featureFlags.subscriptionsEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.SHOP_ENABLED, prepared.featureFlags.shop.enabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.SHOP_BASKETS_ENABLED, prepared.featureFlags.shop.basketsEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.SHOP_VEGETABLES_ENABLED, prepared.featureFlags.shop.vegetablesEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.ASSOCIATION_ROLES_ENABLED, prepared.featureFlags.associationRolesEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.EVENTS_ENABLED, prepared.featureFlags.eventsEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.NEWS_ENABLED, prepared.featureFlags.newsEnabled ? 'true' : 'false')
  ])
}

export async function listRegistryTemplates() {
  return await registryFetch<CmsRegistryTemplateRecord[]>('/v1/templates')
}

export async function listSystemRegistryTemplates() {
  return await registryFetch<CmsRegistryTemplateRecord[]>('/v1/templates', {}, 'system')
}

export async function listManagedRegistryTemplates(): Promise<CmsRegistryTemplateRecord[]> {
  const customConfig = getRegistryConfig('custom')
  const systemConfig = getRegistryConfig('system')

  if (!customConfig.url) {
    return isCmsSystemTemplatesRegistryConfigured() ? await listSystemRegistryTemplates() : []
  }

  if (
    customConfig.url
    && systemConfig.url
    && customConfig.url === systemConfig.url
    && customConfig.apiKey === systemConfig.apiKey
  ) {
    return await listRegistryTemplates()
  }

  const [systemTemplates, customTemplates] = await Promise.all([
    isCmsSystemTemplatesRegistryConfigured() ? listSystemRegistryTemplates().catch(() => []) : Promise.resolve([]),
    isCmsRegistryConfigured() ? listRegistryTemplates().catch(() => []) : Promise.resolve([])
  ])

  const merged = new Map<string, CmsRegistryTemplateRecord>()
  for (const template of systemTemplates) merged.set(template.slug, template)
  for (const template of customTemplates) merged.set(template.slug, template)
  return [...merged.values()].filter(template => !template.deletedAt)
}

export async function listMergedSiteTemplates(): Promise<CmsSiteTemplateDefinition[]> {
  const fallback = [FALLBACK_SITE_TEMPLATE]
  try {
    const customConfig = getRegistryConfig('custom')
    const systemConfig = getRegistryConfig('system')

    let records: CmsRegistryTemplateRecord[] = []
    if (
      customConfig.url
      && systemConfig.url
      && customConfig.url === systemConfig.url
      && customConfig.apiKey === systemConfig.apiKey
    ) {
      records = await listRegistryTemplates()
    } else {
      const [systemTemplates, customTemplates] = await Promise.all([
        isCmsSystemTemplatesRegistryConfigured() ? listSystemRegistryTemplates().catch(() => []) : Promise.resolve([]),
        isCmsRegistryConfigured() ? listRegistryTemplates().catch(() => []) : Promise.resolve([])
      ])
      const merged = new Map<string, CmsRegistryTemplateRecord>()
      for (const template of systemTemplates) merged.set(template.slug, template)
      for (const template of customTemplates) merged.set(template.slug, template)
      records = [...merged.values()]
    }

    const publishedTemplates = records
      .filter(template => !template.deletedAt && template.currentVersionId)
      .map((template) => ({
        key: template.slug,
        label: template.label,
        description: template.description,
        icon: template.icon,
        previewImage: template.previewImage || FALLBACK_SITE_TEMPLATE.previewImage,
        highlights: template.highlights || [],
        themeNames: template.themeNames || [],
        sourceType: template.sourceType
      } satisfies CmsSiteTemplateDefinition))

    return publishedTemplates.length ? publishedTemplates : fallback
  } catch {
    return fallback
  }
}

export async function getRegistryTemplate(slug: string, scope: RegistryScope = 'custom') {
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}`, {}, scope)
}

export async function createRegistryTemplate(input: {
  slug: string
  label: CmsLocalizedText
  description: CmsLocalizedText
  icon: string
  previewImage?: string
  highlights?: CmsLocalizedText[]
  themeNames?: string[]
}, scope: RegistryScope = 'custom') {
  const snapshot = await exportCurrentTemplateSnapshot()
  return await createRegistryTemplateFromSnapshot(input, snapshot, scope)
}

export async function createRegistryTemplateFromSnapshot(input: {
  slug: string
  label: CmsLocalizedText
  description: CmsLocalizedText
  icon: string
  previewImage?: string
  highlights?: CmsLocalizedText[]
  themeNames?: string[]
}, snapshot: CmsRegistryTemplateSnapshot, scope: RegistryScope = 'custom') {
  return await registryFetch<CmsRegistryTemplateRecord>('/v1/templates', {
    method: 'POST',
    body: {
      ...input,
      sourceType: scope === 'system' ? 'system' : 'custom',
      snapshot
    }
  }, scope)
}

export async function updateRegistryTemplate(slug: string, input: {
  label?: CmsLocalizedText
  description?: CmsLocalizedText
  icon?: string
  previewImage?: string
  highlights?: CmsLocalizedText[]
  themeNames?: string[]
}, scope: RegistryScope = 'custom') {
  const snapshot = await exportCurrentTemplateSnapshot()
  return await updateRegistryTemplateFromSnapshot(slug, input, snapshot, scope)
}

export async function updateRegistryTemplateFromSnapshot(slug: string, input: {
  label?: CmsLocalizedText
  description?: CmsLocalizedText
  icon?: string
  previewImage?: string
  highlights?: CmsLocalizedText[]
  themeNames?: string[]
}, snapshot: CmsRegistryTemplateSnapshot, scope: RegistryScope = 'custom') {
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}/versions`, {
    method: 'POST',
    body: {
      ...input,
      snapshot
    }
  }, scope)
}

export async function publishRegistryTemplateVersion(slug: string, versionId: string, scope: RegistryScope = 'custom') {
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}/publish/${encodeURIComponent(versionId)}`, {
    method: 'POST'
  }, scope)
}

export async function deleteRegistryTemplateVersion(slug: string, versionId: string, scope: RegistryScope = 'custom') {
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}/versions/${encodeURIComponent(versionId)}`, {
    method: 'DELETE'
  }, scope)
}

export async function deleteRegistryTemplate(slug: string, scope: RegistryScope = 'custom') {
  return await registryFetch<{ ok: true }>(`/v1/templates/${encodeURIComponent(slug)}`, {
    method: 'DELETE'
  }, scope)
}

export async function applyRegistryTemplate(slug: string) {
  let template: CmsRegistryTemplateRecord | null = null
  try {
    template = await getRegistryTemplate(slug, 'custom')
  } catch {
    template = null
  }

  if (!template && isCmsSystemTemplatesRegistryConfigured()) {
    template = await getRegistryTemplate(slug, 'system')
  }

  if (!template) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template unavailable',
      message: 'Ce modèle n’a pas été trouvé dans les registres configurés.'
    })
  }

  if (!template.snapshot) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template snapshot unavailable',
      message: 'Ce template n’a pas de snapshot publié.'
    })
  }

  const preparedSnapshot = rewriteSnapshotAssetUrls(template.snapshot, template.snapshot.assetManifest || [])
  await importTemplateSnapshot(preparedSnapshot)
  return template
}

export async function listRegistryReleases() {
  return await listRegistryReleasesPage(10, 0)
}

export async function listRegistryReleasesPage(limit = 10, offset = 0) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  })
  return await registryFetch<CmsRegistryPaginatedResult<CmsRegistryReleaseRecord>>(`/v1/releases?${query.toString()}`)
}

export async function listRegistryDeployments(limit = 20, offset = 0) {
  const config = getRegistryConfig()
  const query = new URLSearchParams({
    instanceSlug: config.instanceSlug,
    limit: String(limit),
    offset: String(offset)
  })
  return await registryFetch<CmsRegistryPaginatedResult<CmsRegistryDeploymentJob>>(`/v1/deployments?${query.toString()}`)
}

export async function registerRegistryInstance() {
  const config = getRegistryConfig()
  const settings = await getCmsSiteSettings()
  return await registryFetch<CmsRegistryInstanceRecord>('/v1/instances/register', {
    method: 'POST',
    body: {
      slug: config.instanceSlug,
      name: settings.siteName.fr || settings.siteName.en || config.instanceSlug,
      environment: process.env.NODE_ENV || 'development',
      releaseChannel: config.releaseChannel
    }
  })
}

async function updateAgentFetch<T>(path: string, options: RegistryFetchOptions = {}) {
  const config = getCmsUpdateAgentConfig()
  if (!config.url || !config.token) {
    throw createError({
      statusCode: 503,
      statusMessage: 'CMS update agent unavailable',
      message: 'Le moteur local de mise à jour est indisponible sur cette instance.'
    })
  }

  let response: Response
  try {
    response = await fetch(`${config.url.replace(/\/$/, '')}${path}`, {
      method: options.method || 'GET',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.token}`,
        ...options.headers
      },
      body: options.body == null ? undefined : JSON.stringify(options.body)
    })
  } catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'CMS update agent unavailable',
      message: 'Le moteur local de mise à jour est injoignable sur cette instance.'
    })
  }

  if (!response.ok) {
    const text = await response.text()
    throw createError({
      statusCode: response.status,
      statusMessage: 'CMS update agent request failed',
      message: text || `Agent request failed with ${response.status}`
    })
  }

  return await response.json() as T
}

export async function getUpdateAgentStatus() {
  return await updateAgentFetch<{
    currentVersion: string | null
    rollbackVersion: string | null
    releaseChannel: string
    releases: CmsRegistryReleaseRecord[]
    jobs: CmsRegistryDeploymentJob[]
    jobsPagination: CmsRegistryPaginatedResult<CmsRegistryDeploymentJob>
    rollbackCapabilities: CmsRegistryRollbackCapabilities
  }>('/status')
}

export async function getUpdateAgentJobs(limit = 10, offset = 0) {
  const query = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  })
  return await updateAgentFetch<CmsRegistryPaginatedResult<CmsRegistryDeploymentJob>>(`/jobs?${query.toString()}`)
}

export async function triggerUpdateAgentDeployment(version: string) {
  return await updateAgentFetch<CmsRegistryDeploymentJob>('/deploy', {
    method: 'POST',
    body: { version }
  })
}

export async function getUpdateAgentJob(jobId: string) {
  return await updateAgentFetch<CmsRegistryDeploymentJob>(`/jobs/${encodeURIComponent(jobId)}`)
}

export async function triggerUpdateAgentRollback(mode: 'fast' | 'full' = 'fast') {
  return await updateAgentFetch<CmsRegistryDeploymentJob>('/rollback', {
    method: 'POST',
    body: { mode }
  })
}
