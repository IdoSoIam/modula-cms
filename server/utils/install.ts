import fs from 'node:fs'
import path from 'node:path'
import type { H3Event } from 'h3'
import { db } from '#modula/server/data/client'
import cmsProjectConfig from '#modula/cms.project.config'
import type { CmsDbDriver, CmsProjectConfig, CmsRuntimeTarget, CmsStorageDriver } from '#modula/shared/platform'
import { inferCmsRuntimeTargetFromDrivers, resolveCmsPlatformConfig } from '#modula/shared/platform'
import { AuthService } from '#modula/server/services/auth/authService'
import { ensureDefaultRoles } from '#modula/server/utils/permissions'
import { saveCmsRegistryInstanceSettings, saveSiteLocales, setSetting, SETTING_KEYS } from '#modula/server/utils/settings'
import { getSessionConfig } from '#modula/server/utils/session'
import { applySiteTemplate } from '#modula/server/utils/siteTemplates'
import type { CmsSiteTemplateKey } from '#modula/shared/siteTemplates'
import { getCmsSiteSettings, saveCmsSiteSettings } from '#modula/server/utils/cms'
import { applySqliteMigrations } from '#modula/db/migration-system'
import { schemaSnapshotHash, sqliteBootstrapSql } from '#modula/server/generated/bootstrap.generated'

export interface CmsInstallStatus {
  installed: boolean
  firstUserCreated: boolean
  databaseReady: boolean
  generatedConfigExists: boolean
  runtimeCompatible: boolean
  runtimeIssue: string | null
  currentRuntimeTarget: CmsRuntimeTarget
  detectedRuntimeTarget: CmsRuntimeTarget
  configuredRuntimeTarget: CmsRuntimeTarget
  currentDbDriver: CmsDbDriver
  currentStorageDriver: CmsStorageDriver
  canBootstrapCurrentRuntime: boolean
  canBootstrap: boolean
}

export interface CmsInstallBootstrapPayload {
  siteName: string
  taglineFr?: string
  taglineEn?: string
  defaultLocale: 'fr' | 'en'
  dbDriver: CmsDbDriver
  storageDriver: CmsStorageDriver
  adminEmail: string
  adminPassword: string
  adminFirstName?: string
  adminLastName?: string
  siteTemplate: CmsSiteTemplateKey
  registryUrl?: string
  registryApiKey?: string
}

interface WritableProjectConfigOptions {
  siteName: string
  taglineFr: string
  taglineEn: string
  defaultLocale: 'fr' | 'en'
  dbDriver: CmsDbDriver
  storageDriver: CmsStorageDriver
  publicUrl: string
}
const PROJECT_CONFIG_PATH = path.resolve(process.cwd(), 'cms.project.config.ts')

function getMigrationsDir(event?: H3Event): string {
  const resolveMigrationsDir = (value: string) => path.isAbsolute(value) ? value : path.resolve(process.cwd(), value)

  if (event) {
    try {
      const config = useRuntimeConfig(event)
      if (config.cmsMigrationsDir) return resolveMigrationsDir(config.cmsMigrationsDir as string)
    } catch { /* fall through */ }
  }
  try {
    const config = useRuntimeConfig()
    if (config.cmsMigrationsDir) return resolveMigrationsDir(config.cmsMigrationsDir as string)
  } catch { /* fall through */ }
  return path.resolve(process.cwd(), 'migrations')
}

function detectInstallRuntimeTarget(): CmsRuntimeTarget {
  return 'server'
}

function canCurrentRuntimeServeDrivers(runtimeTarget: CmsRuntimeTarget, dbDriver: CmsDbDriver, storageDriver: CmsStorageDriver) {
  return dbDriver === 'sqlite' && storageDriver === 'fs'
}

function isPrismaMissingTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false

  const code = 'code' in error ? String((error as { code?: unknown }).code || '') : ''
  if (code === 'P2021' || code === 'P2022') {
    return true
  }

  const message = 'message' in error ? String((error as { message?: unknown }).message || '') : ''
  return /no such table|table .* does not exist|SQLITE_ERROR/i.test(message)
}

function getDriverIssue(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const message = 'message' in error ? String((error as { message?: unknown }).message || '') : ''
  if (/Database driver ".*" is not implemented yet in this runtime/i.test(message)) {
    return 'unsupported_runtime_driver'
  }
  return null
}

function ensureSupportedWizardCombination(
  detectedRuntimeTarget: CmsRuntimeTarget,
  dbDriver: CmsDbDriver,
  storageDriver: CmsStorageDriver
) {
  if (dbDriver !== 'sqlite' || storageDriver !== 'fs') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Le mode SQLite utilise le stockage fichiers local pour le moment.' })
  }
}

function slugifyProjectKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'modula-project'
}

function inferPublicUrl(event: H3Event) {
  const headers = getRequestHeaders(event)
  const host = headers['x-forwarded-host'] || headers.host || 'localhost:3000'
  const forwardedProto = headers['x-forwarded-proto']
  const protocol = forwardedProto || (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https')
  return `${protocol}://${host}`
}

function escapeTemplateLiteral(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`')
}

export function generatedProjectConfigExists() {
  return fs.existsSync(PROJECT_CONFIG_PATH)
}

function resolveSqliteDatabasePath() {
  const connectionString = process.env.DATABASE_URL?.startsWith('file:')
    ? process.env.DATABASE_URL
    : 'file:./.data/sqlite/local.db'
  const rawPath = connectionString.replace(/^file:/, '')
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
}

export async function applySqliteMigrationsIfNeeded(event?: H3Event) {
  await applySqliteMigrations({
    migrationsDir: getMigrationsDir(event),
    databasePath: resolveSqliteDatabasePath(),
    bootstrapSql: sqliteBootstrapSql,
    schemaHash: schemaSnapshotHash
  })
}

export async function getCmsInstallStatus(event?: H3Event): Promise<CmsInstallStatus> {
  const currentPlatform = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  const detectedRuntimeTarget = detectInstallRuntimeTarget()
  let userCount = 0
  let databaseReady = true
  let runtimeCompatible = true
  let runtimeIssue: string | null = null

  try {
    if (currentPlatform.dbDriver === 'sqlite') {
      await applySqliteMigrationsIfNeeded(event)
    }
    userCount = await db.user.count()
  } catch (error) {
    const detectedRuntimeIssue = getDriverIssue(error)
    if (detectedRuntimeIssue) {
      databaseReady = false
      runtimeCompatible = false
      runtimeIssue = detectedRuntimeIssue
      userCount = 0
    } else if (isPrismaMissingTableError(error)) {
      databaseReady = false
      userCount = 0
    } else {
      throw error
    }
  }

  return {
    installed: userCount > 0,
    firstUserCreated: userCount > 0,
    databaseReady,
    generatedConfigExists: generatedProjectConfigExists(),
    runtimeCompatible,
    runtimeIssue,
    currentRuntimeTarget: currentPlatform.runtimeTarget,
    detectedRuntimeTarget,
    configuredRuntimeTarget: currentPlatform.runtimeTarget,
    currentDbDriver: currentPlatform.dbDriver,
    currentStorageDriver: currentPlatform.storageDriver,
    canBootstrapCurrentRuntime: runtimeCompatible && canCurrentRuntimeServeDrivers(detectedRuntimeTarget, currentPlatform.dbDriver, currentPlatform.storageDriver),
    canBootstrap: runtimeCompatible
  }
}

export async function bootstrapCmsInstallation(event: H3Event, payload: CmsInstallBootstrapPayload) {
  const currentPlatform = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  const detectedRuntimeTarget = detectInstallRuntimeTarget()
  const nextRuntimeTarget = inferCmsRuntimeTargetFromDrivers(payload.dbDriver)

  ensureSupportedWizardCombination(detectedRuntimeTarget, payload.dbDriver, payload.storageDriver)
  const sameRuntime = nextRuntimeTarget === currentPlatform.runtimeTarget
  const sameDatabase = payload.dbDriver === currentPlatform.dbDriver
  const sameStorage = payload.storageDriver === currentPlatform.storageDriver
  const canFinalizeNow = sameRuntime
    && sameDatabase
    && sameStorage
    && canCurrentRuntimeServeDrivers(detectedRuntimeTarget, payload.dbDriver, payload.storageDriver)

  if (!canFinalizeNow) {
    return {
      installed: false,
      configurationSaved: true,
      restartRequired: true,
      message: 'La configuration a été enregistrée. Redémarrez maintenant cette instance serveur avec la configuration générée, puis revenez terminer l\'installation.'
    }
  }

  await applySqliteMigrationsIfNeeded(event)

  let existingUserCount = 0
  try {
    existingUserCount = await db.user.count()
  } catch (error) {
    if (isPrismaMissingTableError(error)) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Database not ready',
        message: 'La base sélectionnée n\'est pas encore migrée. Appliquez d\'abord les migrations, puis relancez l\'assistant.'
      })
    }
    throw error
  }
  if (existingUserCount > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Installation already completed', message: 'L\'installation est déjà terminée.' })
  }

  await ensureDefaultRoles()

  const authService = new AuthService()
  const user = await authService.createUser(
    payload.adminEmail,
    payload.adminPassword,
    payload.adminFirstName?.trim() || undefined,
    payload.adminLastName?.trim() || undefined,
    undefined,
    'admin'
  )

  await setSetting(SETTING_KEYS.ADMIN_EMAIL, payload.adminEmail.trim().toLowerCase())
  await setSetting(SETTING_KEYS.CONTACT_EMAIL, payload.adminEmail.trim().toLowerCase())
  await setSetting(SETTING_KEYS.REGISTER_ENABLED, 'false')
  await setSetting(SETTING_KEYS.IN_DEVELOPMENT, 'false')
  await saveSiteLocales(['fr', 'en'], payload.defaultLocale)
  await saveCmsRegistryInstanceSettings({
    registryUrl: payload.registryUrl?.trim() || '',
    registryApiKey: payload.registryApiKey?.trim() || ''
  })
  const siteSettings = await getCmsSiteSettings()
  await saveCmsSiteSettings({
    ...siteSettings,
    siteName: {
      fr: payload.siteName,
      en: payload.siteName
    },
    siteTagline: {
      fr: payload.taglineFr?.trim() || siteSettings.siteTagline.fr || '',
      en: payload.taglineEn?.trim() || siteSettings.siteTagline.en || ''
    }
  })
  let templateApplied = true
  let templateApplyError: string | null = null
  try {
    await applySiteTemplate(payload.siteTemplate, {
      replaceBrandAssets: true
    })
  } catch (error: any) {
    templateApplied = false
    templateApplyError = error?.message || 'Erreur inconnue lors de l\'application du template.'
  }

  const session = await useSession(event, getSessionConfig(event))
  await session.clear()
  await session.update({ userId: user.id })

  return {
    installed: true,
    configurationSaved: true,
    restartRequired: true,
    templateApplied,
    templateApplyError,
    user,
    message: templateApplied
      ? 'Installation terminée. Le premier administrateur a été créé. Redémarrez l\'application pour appliquer entièrement la configuration du projet.'
      : 'Installation terminée, mais le template n\'a pas pu être appliqué automatiquement. Redémarrez puis appliquez-le depuis l\'admin.'
  }
}
