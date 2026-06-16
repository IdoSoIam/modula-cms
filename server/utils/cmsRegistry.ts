import { createHash, randomUUID } from 'node:crypto'
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
import { BUNDLED_SYSTEM_TEMPLATE_ASSET_SOURCES, FALLBACK_SITE_TEMPLATE, type CmsSiteTemplateDefinition } from '#modula/shared/siteTemplates'

type RegistryFetchOptions = {
  method?: string
  body?: any
  headers?: Record<string, string>
}

type RegistryScope = 'custom' | 'system'

type TemplateAssetMaterializationContext = {
  cache: Map<string, string>
  preservedFilenames: Set<string>
}

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
    if (value.startsWith('/uploads/') || value.startsWith('/site-templates/') || value.startsWith('/brand/')) {
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
    contentType: url.endsWith('.svg')
      ? 'image/svg+xml'
      : url.endsWith('.ico')
        ? 'image/x-icon'
        : 'application/octet-stream'
  }
}

function resolveBundledAssetPath(url: string) {
  if (url === '/site-templates/modula-mark.svg') {
    return path.resolve(process.cwd(), 'public', 'modula-mark.svg')
  }
  if (url === '/brand/modula-mark.svg') {
    return path.resolve(process.cwd(), 'public', 'modula-mark.svg')
  }
  if (url === '/brand/favicon.ico') {
    return path.resolve(process.cwd(), 'public', 'favicon.ico')
  }

  const normalized = url.replace(/^\//, '').replace(/\//g, path.sep)
  const candidates = [
    path.resolve(process.cwd(), 'system-assets', normalized),
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

      if (url.startsWith('/site-templates/') || url.startsWith('/brand/')) {
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
  const targetName = buildTemplateManagedTargetName(asset)
  await putUploadObject(targetName, bytes, asset.contentType)
  await registerImportedTemplateImage(targetName, asset.contentType, bytes.byteLength)
  return `/uploads/${targetName}`
}

function sanitizeTemplateFilenamePart(value: string) {
  return value
    .trim()
    .replace(/^\/+/, '')
    .replace(/[\\/]+/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildTemplateManagedTargetName(asset: CmsRegistryAssetReference) {
  const sourceUrl = asset.sourceUrl?.trim() || ''
  const sourceBase = sourceUrl ? basename(sourceUrl) : ''
  const filenameBase = asset.filename?.trim() || ''
  const candidate = sanitizeTemplateFilenamePart(sourceBase || filenameBase || '')
  const extension = extname(candidate || filenameBase) || extname(asset.filename || '') || ''
  const stem = candidate
    ? candidate.slice(0, extension ? -extension.length : undefined)
    : `asset-${asset.id || randomUUID()}`

  return `template-${stem}${extension}`
}

async function registerImportedTemplateImage(filename: string, contentType: string, size: number) {
  if (!contentType.startsWith('image/')) {
    return
  }

  const { isRuntimeD1Active } = await import('#modula/server/platform/runtimeDb')
  if (isRuntimeD1Active()) {
    return
  }

  const { prisma } = await import('#modula/prisma/client')
  const url = `/uploads/${filename}`
  const existing = await prisma.image.findFirst({
    where: {
      OR: [
        { filename },
        { url }
      ]
    }
  })

  if (existing) {
    await prisma.image.update({
      where: { id: existing.id },
      data: {
        filename,
        url,
        mimeType: contentType,
        size
      }
    })
    return
  }

  await prisma.image.create({
    data: {
      filename,
      url,
      mimeType: contentType,
      size,
      width: null,
      height: null,
      uploadedById: null
    }
  })
}

async function findRegistryAssetBySourceUrl(sourceUrl: string, scope: RegistryScope = 'custom') {
  const query = new URLSearchParams({ sourceUrl })
  return await registryFetch<CmsRegistryAssetReference>(`/v1/template-assets/by-source?${query.toString()}`, {}, scope)
}

async function syncImportedTemplateImageUsages() {
  const { isRuntimeD1Active } = await import('#modula/server/platform/runtimeDb')
  if (isRuntimeD1Active()) {
    return
  }

  const { syncImageUsageTable } = await import('#modula/server/utils/imageReferences')
  await syncImageUsageTable()
}

async function materializePreservedBrandAsset<T extends { src: string } | null | undefined>(
  value: T,
  scope: RegistryScope,
  context: TemplateAssetMaterializationContext
): Promise<T> {
  if (!value?.src) {
    return value
  }

  const nextSrc = await materializeBundledTemplateAssetUrls(value.src, scope, context)
  if (typeof nextSrc !== 'string' || nextSrc === value.src) {
    return value
  }

  return {
    ...value,
    src: nextSrc
  } as T
}

function isTemplateManagedFilename(filename: string) {
  return filename.startsWith('asset_') || filename.startsWith('template-') || filename.startsWith('brand-template-')
}

async function registerTemplateManagedLocalAsset(sourceUrl: string) {
  const asset = await readBundledAsset(sourceUrl)
  const targetName = buildTemplateManagedTargetName({
    id: '',
    filename: asset.filename,
    contentType: asset.contentType,
    checksum: '',
    downloadUrl: '',
    publicUrl: '',
    sourceUrl
  })
  await putUploadObject(targetName, asset.bytes, asset.contentType)
  await registerImportedTemplateImage(targetName, asset.contentType, asset.bytes.byteLength)
  return `/uploads/${targetName}`
}

function mimeTypeToExtension(contentType: string) {
  switch (contentType) {
    case 'image/svg+xml':
      return '.svg'
    case 'image/png':
      return '.png'
    case 'image/jpeg':
      return '.jpg'
    case 'image/webp':
      return '.webp'
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return '.ico'
    default:
      return ''
  }
}

async function importTemplateAssetFromSourceUrl(
  sourceUrl: string,
  scope: RegistryScope,
  context: TemplateAssetMaterializationContext
) {
  const cached = context.cache.get(sourceUrl)
  if (cached) {
    return cached
  }

  try {
    const remoteAsset = await findRegistryAssetBySourceUrl(sourceUrl, scope)
    const materialized = await importRegistryAsset(remoteAsset)
    context.cache.set(sourceUrl, materialized)
    context.preservedFilenames.add(buildTemplateManagedTargetName(remoteAsset))
    return materialized
  } catch {}

  const localAsset = await registerTemplateManagedLocalAsset(sourceUrl)
  context.cache.set(sourceUrl, localAsset)
  context.preservedFilenames.add(localAsset.replace(/^\/uploads\//, ''))
  return localAsset
}

async function materializeBundledTemplateAssetUrls<T>(
  value: T,
  scope: RegistryScope = 'custom',
  context: TemplateAssetMaterializationContext = {
    cache: new Map<string, string>(),
    preservedFilenames: new Set<string>()
  }
): Promise<T> {
  if (typeof value === 'string') {
    if (value.startsWith('/site-templates/') || value.startsWith('/brand/')) {
      return await importTemplateAssetFromSourceUrl(value, scope, context) as T
    }
    return value
  }

  if (Array.isArray(value)) {
    return await Promise.all(value.map(item => materializeBundledTemplateAssetUrls(item, scope, context))) as T
  }

  if (value && typeof value === 'object') {
    const entries = await Promise.all(
      Object.entries(value as Record<string, unknown>).map(async ([key, item]) => {
        return [key, await materializeBundledTemplateAssetUrls(item, scope, context)]
      })
    )
    return Object.fromEntries(entries) as T
  }

  return value
}

async function cleanupUnusedTemplateManagedImages(preservedFilenames: Set<string> = new Set()) {
  const { isRuntimeD1Active } = await import('#modula/server/platform/runtimeDb')
  if (isRuntimeD1Active()) {
    return
  }

  const [{ prisma }, { listImageUsageAssociations }, { deleteImageVariants }, { deleteUploadObject }] = await Promise.all([
    import('#modula/prisma/client'),
    import('#modula/server/utils/imageReferences'),
    import('#modula/server/utils/imageVariants'),
    import('#modula/server/utils/uploadStorage')
  ])

  const managedImages = await prisma.image.findMany({
    where: {
      uploadedById: null
    },
    select: {
      id: true,
      filename: true,
      url: true
    }
  })

  for (const image of managedImages) {
    if (!isTemplateManagedFilename(image.filename)) continue
    if (preservedFilenames.has(image.filename)) continue

    const usages = await listImageUsageAssociations(image.id)
    if (usages.length > 0) continue

    await deleteImageVariants(image.id)
    if (image.url.startsWith('/uploads/')) {
      await deleteUploadObject(image.filename)
    }
    await prisma.image.delete({ where: { id: image.id } })
  }
}

async function ensureRegistryTemplateAuxiliaryAssetsImported(
  template: CmsRegistryTemplateRecord,
  scope: RegistryScope,
  context: TemplateAssetMaterializationContext
) {
  const sources = BUNDLED_SYSTEM_TEMPLATE_ASSET_SOURCES[template.slug] || []
  if (!sources.length) {
    return
  }

  for (const sourceUrl of sources) {
    await importTemplateAssetFromSourceUrl(sourceUrl, scope, context)
  }
}

async function materializeSnapshotAssets(
  snapshot: CmsRegistryTemplateSnapshot,
  scope: RegistryScope = 'custom',
  context: TemplateAssetMaterializationContext = {
    cache: new Map<string, string>(),
    preservedFilenames: new Set<string>()
  }
) {
  const assetUrlMap = new Map<string, string>()
  for (const asset of snapshot.assetManifest) {
    assetUrlMap.set(asset.downloadUrl, await importRegistryAsset(asset))
    context.preservedFilenames.add(buildTemplateManagedTargetName(asset))
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

  const downloadedSnapshot = rewriteDownloadedUrls(snapshot)
  return await materializeBundledTemplateAssetUrls(downloadedSnapshot, scope, context)
}

export async function importTemplateSnapshot(
  snapshot: CmsRegistryTemplateSnapshot,
  options: {
    replaceBrandAssets?: boolean
    registryScope?: RegistryScope
  } = {}
) {
  const registryScope = options.registryScope || 'custom'
  const context: TemplateAssetMaterializationContext = {
    cache: new Map<string, string>(),
    preservedFilenames: new Set<string>()
  }
  const prepared = await materializeSnapshotAssets(snapshot, registryScope, context)
  const currentSettings = await getCmsSiteSettings()
  const [preservedLogo, preservedFavicon] = await Promise.all([
    materializePreservedBrandAsset(currentSettings.logo, registryScope, context),
    materializePreservedBrandAsset(currentSettings.favicon, registryScope, context)
  ])
  const nextSettings = options.replaceBrandAssets
    ? prepared.siteSettings
    : {
        ...prepared.siteSettings,
        logo: preservedLogo,
        favicon: preservedFavicon
      }

  await saveCmsSiteSettings(nextSettings)
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
  await syncImportedTemplateImageUsages()
  await cleanupUnusedTemplateManagedImages(context.preservedFilenames)
}

function toRegistryPublicTemplateAssetUrl(assetId: string, scope: RegistryScope = 'custom') {
  const config = getRegistryConfig(scope)
  if (!config.url) return ''
  return `${config.url.replace(/\/$/, '')}/public/template-assets/${encodeURIComponent(assetId)}`
}

function buildRegistryAssetPublicUrlMap(records: CmsRegistryTemplateRecord[], scope: RegistryScope) {
  const map = new Map<string, string>()

  for (const record of records) {
    for (const asset of record.snapshot?.assetManifest || []) {
      const sourceUrl = asset.sourceUrl?.trim() || ''
      if (!sourceUrl) continue

      const publicUrl = asset.publicUrl?.trim()
        || (asset.id ? toRegistryPublicTemplateAssetUrl(asset.id, scope) : '')

      if (publicUrl && !map.has(sourceUrl)) {
        map.set(sourceUrl, publicUrl)
      }
    }
  }

  return map
}

function normalizeTemplatePreviewImage(
  record: CmsRegistryTemplateRecord,
  scope: RegistryScope = 'custom',
  sharedAssetUrls: Map<string, string> = new Map()
) {
  const previewImage = record.previewImage?.trim() || ''
  if (!previewImage) return previewImage

  const normalizedPreviewPath = previewImage.replace(/^https?:\/\/[^/]+/i, '')
  const sharedPublicUrl = sharedAssetUrls.get(normalizedPreviewPath)
  if (sharedPublicUrl) {
    return sharedPublicUrl
  }

  const previewAsset = record.snapshot?.assetManifest?.find((asset) => {
    const sourceUrl = asset.sourceUrl?.trim() || ''
    const normalizedSourcePath = sourceUrl.replace(/^https?:\/\/[^/]+/i, '')
    return normalizedSourcePath === normalizedPreviewPath
  })

  if (previewAsset?.publicUrl) {
    return previewAsset.publicUrl
  }

  if (previewAsset?.id) {
    const publicUrl = toRegistryPublicTemplateAssetUrl(previewAsset.id, scope)
    if (publicUrl) return publicUrl
  }

  const legacyDownloadMatch = previewImage.match(/\/v1\/template-assets\/([^/]+)\/download$/)
  if (legacyDownloadMatch) {
    const publicUrl = toRegistryPublicTemplateAssetUrl(decodeURIComponent(legacyDownloadMatch[1]!), scope)
    if (publicUrl) return publicUrl
  }

  return previewImage
}

function normalizeRegistryTemplateRecord(
  record: CmsRegistryTemplateRecord,
  scope: RegistryScope = 'custom',
  sharedAssetUrls: Map<string, string> = new Map()
): CmsRegistryTemplateRecord {
  return {
    ...record,
    previewImage: normalizeTemplatePreviewImage(record, scope, sharedAssetUrls)
  }
}

export async function listRegistryTemplates() {
  const records = await registryFetch<CmsRegistryTemplateRecord[]>('/v1/templates')
  const sharedAssetUrls = buildRegistryAssetPublicUrlMap(records, 'custom')
  return records.map(record => normalizeRegistryTemplateRecord(record, 'custom', sharedAssetUrls))
}

export async function listSystemRegistryTemplates() {
  const records = await registryFetch<CmsRegistryTemplateRecord[]>('/v1/templates', {}, 'system')
  const sharedAssetUrls = buildRegistryAssetPublicUrlMap(records, 'system')
  return records.map(record => normalizeRegistryTemplateRecord(record, 'system', sharedAssetUrls))
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
  const customConfigured = isCmsRegistryConfigured()
  const systemConfigured = isCmsSystemTemplatesRegistryConfigured()

  if (!customConfigured && !systemConfigured) {
    return fallback
  }

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
        systemConfigured ? listSystemRegistryTemplates().catch(() => []) : Promise.resolve([]),
        customConfigured ? listRegistryTemplates().catch(() => []) : Promise.resolve([])
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

    return publishedTemplates
  } catch {
    return []
  }
}

export async function getRegistryTemplate(slug: string, scope: RegistryScope = 'custom') {
  const record = await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}`, {}, scope)
  return normalizeRegistryTemplateRecord(record, scope)
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

export async function applyRegistryTemplate(
  slug: string,
  options: {
    replaceBrandAssets?: boolean
  } = {}
) {
  let template: CmsRegistryTemplateRecord | null = null
  let resolvedScope: RegistryScope = 'custom'
  try {
    template = await getRegistryTemplate(slug, 'custom')
  } catch {
    template = null
  }

  if (!template && isCmsSystemTemplatesRegistryConfigured()) {
    template = await getRegistryTemplate(slug, 'system')
    resolvedScope = 'system'
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
  await importTemplateSnapshot(preparedSnapshot, {
    ...options,
    registryScope: resolvedScope
  })
  if (template.sourceType === 'system') {
    const context: TemplateAssetMaterializationContext = {
      cache: new Map<string, string>(),
      preservedFilenames: new Set<string>()
    }
    await ensureRegistryTemplateAuxiliaryAssetsImported(template, resolvedScope, context)
    await syncImportedTemplateImageUsages()
    await cleanupUnusedTemplateManagedImages(context.preservedFilenames)
  }
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
