import { createHash } from 'node:crypto'
import { basename, extname } from 'node:path'
import { readFile } from 'node:fs/promises'
import { getCmsPageByPath, getCmsSiteSettings, listCmsNavigationItems, listCmsPages, saveCmsNavigationItems, saveCmsPage, saveCmsSiteSettings } from '#modula/server/utils/cms'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { getDaisyUiThemeConfig, saveDaisyUiThemeConfig } from '#modula/server/utils/themes'
import { getUploadObject, putUploadObject } from '#modula/server/utils/uploadStorage'
import type {
  CmsRegistryAssetReference,
  CmsRegistryDeploymentJob,
  CmsRegistryInstanceRecord,
  CmsRegistryReleaseRecord,
  CmsRegistryTemplateRecord,
  CmsRegistryTemplateSnapshot
} from '#modula/shared/registry'
import type { CmsPagePayload } from '#modula/shared/cms'

type RegistryFetchOptions = {
  method?: string
  body?: any
  headers?: Record<string, string>
}

function getRegistryConfig() {
  return {
    url: process.env.CMS_REGISTRY_URL?.trim() || '',
    apiKey: process.env.CMS_REGISTRY_API_KEY?.trim() || '',
    instanceSlug: process.env.CMS_INSTANCE_SLUG?.trim() || '',
    releaseChannel: process.env.CMS_RELEASE_CHANNEL?.trim() || 'stable'
  }
}

export function isCmsRegistryConfigured() {
  const config = getRegistryConfig()
  return Boolean(config.url && config.apiKey && config.instanceSlug)
}

export function getCmsUpdateAgentConfig() {
  return {
    url: process.env.CMS_UPDATE_AGENT_URL?.trim() || 'http://127.0.0.1:4401',
    token: process.env.CMS_UPDATE_AGENT_TOKEN?.trim() || 'modula-local-agent'
  }
}

export function isCmsUpdateAgentConfigured() {
  return isCmsRegistryConfigured()
}

async function registryFetch<T>(path: string, options: RegistryFetchOptions = {}): Promise<T> {
  const config = getRegistryConfig()
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
  const sourcePath = new URL(`../../public${url}`, import.meta.url)
  const bytes = await readFile(sourcePath)
  return {
    filename,
    bytes: new Uint8Array(bytes),
    contentType: url.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream'
  }
}

async function exportTemplateAssets(snapshotSource: Omit<CmsRegistryTemplateSnapshot, 'assetManifest'>) {
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
}

export async function listRegistryTemplates() {
  return await registryFetch<CmsRegistryTemplateRecord[]>('/v1/templates')
}

export async function getRegistryTemplate(slug: string) {
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}`)
}

export async function createRegistryTemplate(input: {
  slug: string
  label: CmsLocalizedText
  description: CmsLocalizedText
  icon: string
  previewImage?: string
  highlights?: CmsLocalizedText[]
  themeNames?: string[]
}) {
  const snapshot = await exportCurrentTemplateSnapshot()
  return await registryFetch<CmsRegistryTemplateRecord>('/v1/templates', {
    method: 'POST',
    body: {
      ...input,
      snapshot
    }
  })
}

export async function updateRegistryTemplate(slug: string, input: {
  label?: CmsLocalizedText
  description?: CmsLocalizedText
  icon?: string
  previewImage?: string
  highlights?: CmsLocalizedText[]
  themeNames?: string[]
}) {
  const snapshot = await exportCurrentTemplateSnapshot()
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}/versions`, {
    method: 'POST',
    body: {
      ...input,
      snapshot
    }
  })
}

export async function publishRegistryTemplateVersion(slug: string, versionId: string) {
  return await registryFetch<CmsRegistryTemplateRecord>(`/v1/templates/${encodeURIComponent(slug)}/publish/${encodeURIComponent(versionId)}`, {
    method: 'POST'
  })
}

export async function deleteRegistryTemplate(slug: string) {
  return await registryFetch<{ ok: true }>(`/v1/templates/${encodeURIComponent(slug)}`, {
    method: 'DELETE'
  })
}

export async function applyRegistryTemplate(slug: string) {
  const template = await getRegistryTemplate(slug)
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
  return await registryFetch<CmsRegistryReleaseRecord[]>('/v1/releases')
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
      message: 'L’agent de mise à jour n’est pas configuré.'
    })
  }

  const response = await fetch(`${config.url.replace(/\/$/, '')}${path}`, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.token}`,
      ...options.headers
    },
    body: options.body == null ? undefined : JSON.stringify(options.body)
  })

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
    releaseChannel: string
    releases: CmsRegistryReleaseRecord[]
    jobs: CmsRegistryDeploymentJob[]
  }>('/status')
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
