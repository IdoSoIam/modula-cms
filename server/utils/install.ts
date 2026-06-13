import fs from 'node:fs'
import path from 'node:path'
import type { H3Event } from 'h3'
import { prisma } from '#modula/prisma/client'
import cmsProjectConfig from '#modula/cms.project.config'
import type { CmsDbDriver, CmsProjectConfig, CmsRuntimeTarget, CmsStorageDriver } from '#modula/shared/platform'
import { inferCmsRuntimeTargetFromDrivers, resolveCmsPlatformConfig } from '#modula/shared/platform'
import { AuthService } from '#modula/server/services/auth/authService'
import { ensureDefaultRoles } from '#modula/server/utils/permissions'
import { setSetting, SETTING_KEYS } from '#modula/server/utils/settings'
import { getSessionConfig } from '#modula/server/utils/session'
import { applySiteTemplate } from '#modula/server/utils/siteTemplates'
import type { CmsSiteTemplateKey } from '#modula/shared/siteTemplates'
import { getCmsSiteSettings, saveCmsSiteSettings } from '#modula/server/utils/cms'
import { isCloudflareRuntime } from '#modula/server/platform/runtime'
import { countRuntimeUsers, isRuntimeD1Active } from '#modula/server/platform/runtimeDb'

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
  cloudflareConfigDetected: boolean
  canSelectCloudflareDrivers: boolean
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

function hasWranglerConfig() {
  return fs.existsSync(path.resolve(process.cwd(), 'wrangler.jsonc'))
}

function detectInstallRuntimeTarget(): CmsRuntimeTarget {
  return isCloudflareRuntime() ? 'cloudflare' : 'server'
}

function canCurrentRuntimeServeDrivers(runtimeTarget: CmsRuntimeTarget, dbDriver: CmsDbDriver, storageDriver: CmsStorageDriver) {
  if (runtimeTarget === 'cloudflare') {
    return dbDriver === 'd1' && storageDriver === 'r2'
  }

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

function getPrismaRuntimeIssue(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null
  const message = 'message' in error ? String((error as { message?: unknown }).message || '') : ''
  if (/CMS_DB_DRIVER=d1 requires the Cloudflare DB binding/i.test(message)) {
    return 'missing_cloudflare_db_binding'
  }
  if (/Database driver ".*" is not implemented yet in this runtime/i.test(message)) {
    return 'unsupported_runtime_driver'
  }
  return null
}

function ensureSupportedWizardCombination(
  detectedRuntimeTarget: CmsRuntimeTarget,
  cloudflareConfigDetected: boolean,
  dbDriver: CmsDbDriver,
  storageDriver: CmsStorageDriver
) {
  if (dbDriver === 'sqlite' || storageDriver === 'fs') {
    if (dbDriver !== 'sqlite' || storageDriver !== 'fs') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Le mode SQLite utilise le stockage fichiers local pour le moment.' })
    }
    if (detectedRuntimeTarget === 'cloudflare') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Cette instance tourne déjà dans un runtime Cloudflare. Utilisez D1 + R2 pour cette installation.' })
    }
    return
  }

  if (dbDriver === 'd1' || storageDriver === 'r2') {
    if (dbDriver !== 'd1' || storageDriver !== 'r2') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Le mode D1 utilise R2 pour le moment.' })
    }
    if (!cloudflareConfigDetected) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Aucune configuration Cloudflare n’a été détectée à la racine du projet.' })
    }
    return
  }

  throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Combinaison de stockage ou base non supportée pour le moment.' })
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
    : 'file:./prisma/local.db'
  const rawPath = connectionString.replace(/^file:/, '')
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
}

function inferAlreadyApplied(db: any, file: string) {
  const tableExists = (tableName: string) => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
    return Boolean(row)
  }

  const columnExists = (tableName: string, columnName: string) => {
    if (!tableExists(tableName)) return false
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all() as Array<{ name: string }>
    return columns.some((column) => column.name === columnName)
  }

  switch (file) {
    case '0001_init.sql':
      return tableExists('SiteParams')
    case '0002_drop_image_data.sql':
      return tableExists('Image') && !columnExists('Image', 'data')
    case '0003_add_cms_foundations.sql':
      return tableExists('CmsPage') && tableExists('CmsNavigationItem')
    case '0004_add_cms_page_specialrole.sql':
      return tableExists('CmsPage') && columnExists('CmsPage', 'specialRole')
    case '0005_add_image_variants_and_usages.sql':
      return tableExists('ImageVariant') && tableExists('ImageUsage')
    case '0006_add_roles_and_events.sql':
      return tableExists('Role') && tableExists('Event') && tableExists('RolePermission')
    case '0007_add_member_roles_and_event_audience_split.sql':
      return tableExists('MemberRole') && tableExists('UserMemberRole') && tableExists('EventAudienceMemberRole')
    case '0008_add_event_recurrence_and_occurrences.sql':
      return tableExists('EventOccurrence') && columnExists('Event', 'recurrenceType')
    case '0009_add_password_setup_tokens.sql':
      return tableExists('PasswordSetupToken')
    case '0010_add_cms_update_jobs.sql':
      return tableExists('cms_update_jobs') && tableExists('cms_update_job_logs')
    default:
      return false
  }
}

function getMigrationAliases(file: string) {
  switch (file) {
    case '0007_add_member_roles_and_event_audience_split.sql':
      return ['007_add_member_roles_and_event_audience_split.sql']
    case '0008_add_event_recurrence_and_occurrences.sql':
      return ['008_add_event_recurrence_and_occurrences.sql']
    case '0009_add_password_setup_tokens.sql':
      return ['009_add_password_setup_tokens.sql']
    case '0010_add_cms_update_jobs.sql':
      return ['010_add_cms_update_jobs.sql']
    default:
      return []
  }
}

function reconcileMigrationAliases(db: any) {
  const pairs: Array<[string, string]> = [
    ['007_add_member_roles_and_event_audience_split.sql', '0007_add_member_roles_and_event_audience_split.sql'],
    ['008_add_event_recurrence_and_occurrences.sql', '0008_add_event_recurrence_and_occurrences.sql'],
    ['009_add_password_setup_tokens.sql', '0009_add_password_setup_tokens.sql'],
    ['010_add_cms_update_jobs.sql', '0010_add_cms_update_jobs.sql']
  ]

  for (const [legacyName, canonicalName] of pairs) {
    const row = db.prepare('SELECT 1 FROM "_local_migrations" WHERE name = ?').get(legacyName)
    if (row) {
      db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(canonicalName)
      db.prepare('DELETE FROM "_local_migrations" WHERE name = ?').run(legacyName)
    }
  }
}

export async function applySqliteMigrationsIfNeeded(event?: H3Event) {
  const migrationsDir = getMigrationsDir(event)
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migration directory not found: ${migrationsDir}`)
  }

  const databasePath = resolveSqliteDatabasePath()
  fs.mkdirSync(path.dirname(databasePath), { recursive: true })

  const { default: BetterSqlite3 } = await import('better-sqlite3')
  const db = new BetterSqlite3(databasePath)
  try {
    db.pragma('foreign_keys = ON')
    db.exec(`
      CREATE TABLE IF NOT EXISTS "_local_migrations" (
        "name" TEXT NOT NULL PRIMARY KEY,
        "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `)
    reconcileMigrationAliases(db)

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    const appliedRows = db.prepare('SELECT name FROM "_local_migrations"').all() as Array<{ name: string }>
    const appliedNames = new Set(appliedRows.map(row => row.name))

    for (const file of migrationFiles) {
      const aliases = getMigrationAliases(file)
      const matchedAlias = aliases.find(alias => appliedNames.has(alias))
      if (appliedNames.has(file) || matchedAlias) {
        if (matchedAlias && !appliedNames.has(file)) {
          db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
        }
        continue
      }

      if (inferAlreadyApplied(db, file)) {
        db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
        continue
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      if (!sql.trim()) {
        db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
        continue
      }

      db.exec(sql)
      db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
    }
  } finally {
    db.close()
  }
}

export async function getCmsInstallStatus(event?: H3Event): Promise<CmsInstallStatus> {
  const currentPlatform = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  const detectedRuntimeTarget = detectInstallRuntimeTarget()
  const cloudflareConfigDetected = hasWranglerConfig()
  let userCount = 0
  let databaseReady = true
  let runtimeCompatible = true
  let runtimeIssue: string | null = null

  try {
    if (currentPlatform.dbDriver === 'sqlite') {
      await applySqliteMigrationsIfNeeded(event)
    }
    userCount = isRuntimeD1Active()
      ? await countRuntimeUsers()
      : await prisma.user.count()
  } catch (error) {
    const detectedRuntimeIssue = getPrismaRuntimeIssue(error)
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
    cloudflareConfigDetected,
    canSelectCloudflareDrivers: detectedRuntimeTarget === 'cloudflare' || cloudflareConfigDetected
  }
}

export async function bootstrapCmsInstallation(event: H3Event, payload: CmsInstallBootstrapPayload) {
  const currentPlatform = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  const detectedRuntimeTarget = detectInstallRuntimeTarget()
  const cloudflareConfigDetected = hasWranglerConfig()
  const nextRuntimeTarget = inferCmsRuntimeTargetFromDrivers(payload.dbDriver)

  ensureSupportedWizardCombination(detectedRuntimeTarget, cloudflareConfigDetected, payload.dbDriver, payload.storageDriver)
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
      message: nextRuntimeTarget === 'cloudflare'
        ? 'La configuration a été enregistrée. Relancez maintenant le projet dans le runtime Cloudflare prévu par ce socle, puis revenez terminer l’installation.'
        : 'La configuration a été enregistrée. Redémarrez maintenant cette instance serveur avec la configuration générée, puis revenez terminer l’installation.'
    }
  }

  if (payload.dbDriver === 'sqlite') {
    await applySqliteMigrationsIfNeeded(event)
  }

  let existingUserCount = 0
  try {
    existingUserCount = await prisma.user.count()
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
    await applySiteTemplate(payload.siteTemplate)
  } catch (error: any) {
    templateApplied = false
    templateApplyError = error?.message || 'Erreur inconnue lors de l’application du template.'
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
