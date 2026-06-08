import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { H3Event } from 'h3'
import { prisma } from '#modula/prisma/client'
import cmsProjectConfig from '#modula/cms.project.config'
import type { CmsDbDriver, CmsProjectConfig, CmsRuntimeTarget, CmsStorageDriver } from '#modula/shared/platform'
import { resolveCmsPlatformConfig } from '#modula/shared/platform'
import { AuthService } from '#modula/server/services/auth/authService'
import { ensureDefaultRoles } from '#modula/server/utils/permissions'
import { setSetting, SETTING_KEYS } from '#modula/server/utils/settings'
import { getSessionConfig } from '#modula/server/utils/session'
import { applySiteTemplate } from '#modula/server/utils/siteTemplates'
import type { CmsSiteTemplateKey } from '#modula/shared/siteTemplates'
import { getCmsSiteSettings, saveCmsSiteSettings } from '#modula/server/utils/cms'

export interface CmsInstallStatus {
  installed: boolean
  firstUserCreated: boolean
  databaseReady: boolean
  generatedConfigExists: boolean
  runtimeCompatible: boolean
  runtimeIssue: string | null
  currentRuntimeTarget: CmsRuntimeTarget
  currentDbDriver: CmsDbDriver
  currentStorageDriver: CmsStorageDriver
  canBootstrapCurrentRuntime: boolean
}

export interface CmsInstallBootstrapPayload {
  siteName: string
  taglineFr?: string
  taglineEn?: string
  defaultLocale: 'fr' | 'en'
  runtimeTarget: CmsRuntimeTarget
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
  runtimeTarget: CmsRuntimeTarget
  dbDriver: CmsDbDriver
  storageDriver: CmsStorageDriver
  publicUrl: string
}

const GENERATED_PROJECT_CONFIG_PATH = path.resolve(process.cwd(), 'cms.project.generated.ts')
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

function getMigrationsDir(event?: H3Event): string {
  if (event) {
    try {
      const config = useRuntimeConfig(event)
      if (config.cmsMigrationsDir) return config.cmsMigrationsDir as string
    } catch { /* fall through */ }
  }
  try {
    const config = useRuntimeConfig()
    if (config.cmsMigrationsDir) return config.cmsMigrationsDir as string
  } catch { /* fall through */ }
  return path.resolve(process.cwd(), 'migrations')
}

function getD1DatabaseNameFromWranglerConfig() {
  const wranglerConfigPath = path.resolve(process.cwd(), 'wrangler.jsonc')
  if (!fs.existsSync(wranglerConfigPath)) return null
  const content = fs.readFileSync(wranglerConfigPath, 'utf8')
  const match = content.match(/"database_name"\s*:\s*"([^"]+)"/)
  return match?.[1] ?? null
}

async function applyD1LocalMigrationsIfNeeded() {
  const databaseName = getD1DatabaseNameFromWranglerConfig()
  const wranglerConfigPath = path.resolve(process.cwd(), 'wrangler.jsonc')
  const migrationsDir = path.resolve(PACKAGE_ROOT, 'migrations')
  if (!databaseName) {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 configuration missing',
      message: 'Impossible de déterminer le nom de la base D1 depuis wrangler.jsonc.'
    })
  }

  try {
    execSync(`npx wrangler d1 migrations apply ${databaseName} --local --config "${wranglerConfigPath}" --cwd "${process.cwd()}" --persist-to ".wrangler/state" --migrations-dir "${migrationsDir}"`, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true
    })
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'D1 migration failed',
      message: 'Échec de l’application des migrations D1 locales via wrangler.'
    })
  }
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

function ensureSupportedWizardCombination(runtimeTarget: CmsRuntimeTarget, dbDriver: CmsDbDriver, storageDriver: CmsStorageDriver) {
  if (runtimeTarget === 'server') {
    if (dbDriver !== 'sqlite') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Le mode serveur classique utilise SQLite pour le moment.' })
    }
    if (storageDriver !== 'fs') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Le mode serveur classique utilise le stockage fichiers local pour le moment.' })
    }
    return
  }

  if (runtimeTarget === 'cloudflare') {
    if (dbDriver !== 'd1' || storageDriver !== 'r2') {
      throw createError({ statusCode: 400, statusMessage: 'Invalid installation configuration', message: 'Le mode Cloudflare utilise D1 et R2 pour le moment.' })
    }
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

function buildGeneratedProjectConfig(options: WritableProjectConfigOptions): CmsProjectConfig {
  const siteName = options.siteName.trim()
  const taglineFr = options.taglineFr.trim() || cmsProjectConfig.site.tagline.fr
  const taglineEn = options.taglineEn.trim() || cmsProjectConfig.site.tagline.en
  const projectKey = slugifyProjectKey(siteName)

  return {
    ...cmsProjectConfig,
    site: {
      ...cmsProjectConfig.site,
      key: projectKey,
      displayName: siteName,
      defaultLocale: options.defaultLocale,
      publicUrl: options.publicUrl,
      tagline: {
        fr: taglineFr,
        en: taglineEn
      },
      defaultPlaceName: siteName,
      defaultVolunteerPlaceName: cmsProjectConfig.site.defaultVolunteerPlaceName || siteName,
      defaultPlaceCity: cmsProjectConfig.site.defaultPlaceCity,
      defaultFarmPickupAddress: cmsProjectConfig.site.defaultFarmPickupAddress
    },
    platform: {
      runtimeTarget: options.runtimeTarget,
      dbDriver: options.dbDriver,
      storageDriver: options.storageDriver
    },
    storage: {
      ...cmsProjectConfig.storage
    },
    modules: {
      ...cmsProjectConfig.modules
    },
    seed: {
      defaultSiteName: {
        fr: siteName,
        en: siteName
      },
      defaultSiteTagline: {
        fr: taglineFr,
        en: taglineEn
      }
    }
  }
}

export function generatedProjectConfigExists() {
  return fs.existsSync(GENERATED_PROJECT_CONFIG_PATH)
}

export function writeGeneratedProjectConfigFile(config: CmsProjectConfig) {
  const serializedJson = JSON.stringify(config, null, 2)
  const fileContents = [
    "import type { CmsProjectConfig } from './shared/platform'",
    '',
    '// Auto-generated by the installation wizard. This file can be replaced safely.',
    `const generatedProjectConfig = ${serializedJson} satisfies CmsProjectConfig`,
    '',
    'export default generatedProjectConfig',
    ''
  ].join('\n')

  fs.writeFileSync(GENERATED_PROJECT_CONFIG_PATH, fileContents, 'utf8')
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
    default:
      return false
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

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    const appliedRows = db.prepare('SELECT name FROM "_local_migrations"').all() as Array<{ name: string }>
    const appliedNames = new Set(appliedRows.map(row => row.name))

    for (const file of migrationFiles) {
      if (appliedNames.has(file)) continue

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
  let userCount = 0
  let databaseReady = true
  let runtimeCompatible = true
  let runtimeIssue: string | null = null

  try {
    if (currentPlatform.dbDriver === 'sqlite') {
      await applySqliteMigrationsIfNeeded(event)
    }
    userCount = await prisma.user.count()
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
    currentDbDriver: currentPlatform.dbDriver,
    currentStorageDriver: currentPlatform.storageDriver,
    canBootstrapCurrentRuntime: runtimeCompatible && (currentPlatform.runtimeTarget === 'server' && currentPlatform.dbDriver === 'sqlite'
      ? true
      : currentPlatform.runtimeTarget === 'cloudflare' && currentPlatform.dbDriver === 'd1'
    )
  }
}

export async function bootstrapCmsInstallation(event: H3Event, payload: CmsInstallBootstrapPayload) {
  ensureSupportedWizardCombination(payload.runtimeTarget, payload.dbDriver, payload.storageDriver)

  const currentPlatform = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  const nextProjectConfig = buildGeneratedProjectConfig({
    siteName: payload.siteName,
    taglineFr: payload.taglineFr || '',
    taglineEn: payload.taglineEn || '',
    defaultLocale: payload.defaultLocale,
    runtimeTarget: payload.runtimeTarget,
    dbDriver: payload.dbDriver,
    storageDriver: payload.storageDriver,
    publicUrl: inferPublicUrl(event)
  })

  writeGeneratedProjectConfigFile(nextProjectConfig)

  const sameRuntime = payload.runtimeTarget === currentPlatform.runtimeTarget
  const sameDatabase = payload.dbDriver === currentPlatform.dbDriver
  const sameStorage = payload.storageDriver === currentPlatform.storageDriver
  const canFinalizeNow = sameRuntime && sameDatabase && sameStorage

  if (!canFinalizeNow) {
    return {
      installed: false,
      configurationSaved: true,
      restartRequired: true,
      message: 'La configuration a été enregistrée. Redémarrez ou redéployez l\'application avec ce mode, puis revenez terminer l\'installation.'
    }
  }

  if (payload.dbDriver === 'sqlite') {
    await applySqliteMigrationsIfNeeded(event)
  } else if (payload.dbDriver === 'd1') {
    await applyD1LocalMigrationsIfNeeded()
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

  const session = await useSession(event, getSessionConfig())
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
