import fs from 'node:fs'
import path from 'node:path'
import type Database from 'better-sqlite3'
import type { SchemaSnapshot } from './schema-compiler.ts'

export type MigrationDialect = 'sqlite' | 'd1' | 'postgres' | 'mysql'

interface MigrationManifestDefinition {
  id: string
  name?: string
  description?: string
  up?: Partial<Record<MigrationDialect | 'shared', string>>
  down?: Partial<Record<MigrationDialect | 'shared', string>>
  beforeSchemaHash?: string | null
  afterSchemaHash?: string | null
  summary?: {
    addedModels?: string[]
    removedModels?: string[]
    changedModels?: Array<{ model: string; changes: string[] }>
  }
}

export interface ResolvedMigration {
  id: string
  name: string
  description?: string
  rootPath: string
  upSqlByDialect: Partial<Record<MigrationDialect | 'shared', string>>
  downSqlByDialect: Partial<Record<MigrationDialect | 'shared', string>>
  beforeSchemaHash?: string | null
  afterSchemaHash?: string | null
}

export interface SqliteMigrationOptions {
  databasePath: string
  migrationsDir: string
  bootstrapSql: string
}

export interface SqliteMigrationStatus {
  appliedIds: string[]
  pendingIds: string[]
  bootstrapApplied: boolean
}

const LEGACY_ALIAS_MAP: Record<string, string> = {
  '007_add_member_roles_and_event_audience_split': '0007_add_member_roles_and_event_audience_split',
  '008_add_event_recurrence_and_occurrences': '0008_add_event_recurrence_and_occurrences',
  '009_add_password_setup_tokens': '0009_add_password_setup_tokens',
  '010_add_cms_update_jobs': '0010_add_cms_update_jobs'
}

function normalizeMigrationId(id: string) {
  return LEGACY_ALIAS_MAP[id] || id
}

function readJsonFile<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
}

function readOptionalFile(filePath: string) {
  if (!fs.existsSync(filePath)) return null
  const content = fs.readFileSync(filePath, 'utf8')
  return content.trim() ? content : ''
}

function isManifestDirectory(rootPath: string) {
  return fs.existsSync(path.join(rootPath, 'manifest.json'))
}

function resolveSqlMap(rootPath: string, mapping: Partial<Record<MigrationDialect | 'shared', string>> | undefined) {
  if (!mapping) return {}

  const resolved: Partial<Record<MigrationDialect | 'shared', string>> = {}
  for (const [dialect, relativePath] of Object.entries(mapping)) {
    if (!relativePath) continue
    const filePath = path.join(rootPath, relativePath)
    const content = readOptionalFile(filePath)
    if (content == null) continue
    resolved[dialect as MigrationDialect | 'shared'] = content
  }
  return resolved
}

function resolveLegacyMigration(filePath: string): ResolvedMigration {
  const id = normalizeMigrationId(path.basename(filePath, '.sql'))
  return {
    id,
    name: id,
    rootPath: filePath,
    upSqlByDialect: {
      shared: fs.readFileSync(filePath, 'utf8')
    },
    downSqlByDialect: {}
  }
}

function resolveManifestMigration(rootPath: string): ResolvedMigration {
  const manifest = readJsonFile<MigrationManifestDefinition>(path.join(rootPath, 'manifest.json'))
  return {
    id: normalizeMigrationId(manifest.id),
    name: manifest.name || manifest.id,
    description: manifest.description,
    rootPath,
    upSqlByDialect: resolveSqlMap(rootPath, manifest.up),
    downSqlByDialect: resolveSqlMap(rootPath, manifest.down),
    beforeSchemaHash: manifest.beforeSchemaHash,
    afterSchemaHash: manifest.afterSchemaHash
  }
}

export function loadResolvedMigrations(migrationsDir: string) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migration directory not found: ${migrationsDir}`)
  }

  return fs.readdirSync(migrationsDir)
    .filter(entry => /^\d+/.test(entry))
    .sort()
    .map((entry) => {
      const absolutePath = path.join(migrationsDir, entry)
      const stat = fs.statSync(absolutePath)
      if (stat.isFile() && entry.endsWith('.sql')) {
        return resolveLegacyMigration(absolutePath)
      }
      if (stat.isDirectory() && isManifestDirectory(absolutePath)) {
        return resolveManifestMigration(absolutePath)
      }
      return null
    })
    .filter((migration): migration is ResolvedMigration => Boolean(migration))
}

export function getMigrationSql(migration: ResolvedMigration, dialect: MigrationDialect, direction: 'up' | 'down' = 'up') {
  const sqlMap = direction === 'up' ? migration.upSqlByDialect : migration.downSqlByDialect
  return sqlMap[dialect] ?? sqlMap.shared ?? ''
}

export function renderMigrationStateTableSql() {
  return `
CREATE TABLE IF NOT EXISTS "_cms_migrations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT,
  "schemaHash" TEXT
);
`.trim()
}

function getUserTables(db: Database.Database) {
  const rows = db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name NOT IN ('_cms_migrations', '_local_migrations')
  `).all() as Array<{ name: string }>

  return rows.map(row => row.name)
}

function hasLegacyLocalMigrationTable(db: Database.Database) {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = '_local_migrations'`).get()
  return Boolean(row)
}

function copyLegacyLocalMigrations(db: Database.Database) {
  if (!hasLegacyLocalMigrationTable(db)) return

  const rows = db.prepare(`SELECT name FROM "_local_migrations"`).all() as Array<{ name: string }>
  for (const row of rows) {
    const normalizedId = normalizeMigrationId(String(row.name).replace(/\.sql$/i, ''))
    db.prepare(`
      INSERT OR IGNORE INTO "_cms_migrations" ("id", "name", "source")
      VALUES (?, ?, 'legacy-local')
    `).run(normalizedId, normalizedId)
  }
}

function listAppliedMigrationIds(db: Database.Database) {
  const rows = db.prepare(`SELECT id FROM "_cms_migrations" ORDER BY id ASC`).all() as Array<{ id: string }>
  return rows.map(row => row.id)
}

function markMigrationsApplied(
  db: Database.Database,
  migrations: ResolvedMigration[],
  source: string,
  schemaHash?: string | null
) {
  const statement = db.prepare(`
    INSERT OR IGNORE INTO "_cms_migrations" ("id", "name", "source", "schemaHash")
    VALUES (?, ?, ?, ?)
  `)

  for (const migration of migrations) {
    statement.run(migration.id, migration.name, source, schemaHash || null)
  }
}

function bootstrapIfNeeded(
  db: Database.Database,
  migrations: ResolvedMigration[],
  bootstrapSql: string,
  schemaHash?: string | null
) {
  db.exec(renderMigrationStateTableSql())
  copyLegacyLocalMigrations(db)

  const alreadyApplied = listAppliedMigrationIds(db)
  if (alreadyApplied.length > 0) {
    return false
  }

  const userTables = getUserTables(db)
  if (userTables.length === 0) {
    if (bootstrapSql.trim()) {
      db.exec(bootstrapSql)
    }
    db.exec(renderMigrationStateTableSql())
    markMigrationsApplied(db, migrations, 'bootstrap', schemaHash)
    return true
  }

  markMigrationsApplied(db, migrations, 'legacy-baseline', schemaHash)
  return true
}

export async function applySqliteMigrations(options: SqliteMigrationOptions & { schemaHash?: string | null }) {
  const { default: BetterSqlite3 } = await import('better-sqlite3')
  const migrations = loadResolvedMigrations(options.migrationsDir)
  fs.mkdirSync(path.dirname(options.databasePath), { recursive: true })
  const db = new BetterSqlite3(options.databasePath)

  try {
    db.pragma('foreign_keys = ON')
    bootstrapIfNeeded(db, migrations, options.bootstrapSql, options.schemaHash)

    const appliedIds = new Set(listAppliedMigrationIds(db))
    for (const migration of migrations) {
      if (appliedIds.has(migration.id)) continue

      const sql = getMigrationSql(migration, 'sqlite')
      if (!sql.trim()) {
        markMigrationsApplied(db, [migration], 'manual-empty', options.schemaHash)
        continue
      }

      db.exec(sql)
      markMigrationsApplied(db, [migration], 'migration', migration.afterSchemaHash || options.schemaHash)
    }
  } finally {
    db.close()
  }
}

export async function getSqliteMigrationStatus(options: SqliteMigrationOptions & { schemaHash?: string | null }): Promise<SqliteMigrationStatus> {
  const { default: BetterSqlite3 } = await import('better-sqlite3')
  const migrations = loadResolvedMigrations(options.migrationsDir)
  fs.mkdirSync(path.dirname(options.databasePath), { recursive: true })
  const db = new BetterSqlite3(options.databasePath)

  try {
    db.pragma('foreign_keys = ON')
    const bootstrapApplied = bootstrapIfNeeded(db, migrations, options.bootstrapSql, options.schemaHash)
    const appliedIds = listAppliedMigrationIds(db)
    const appliedIdSet = new Set(appliedIds)
    const pendingIds = migrations.map(migration => migration.id).filter(id => !appliedIdSet.has(id))

    return {
      appliedIds,
      pendingIds,
      bootstrapApplied
    }
  } finally {
    db.close()
  }
}

export function resolvePreviousSchemaSnapshot(migrationsDir: string): SchemaSnapshot | null {
  const migrationEntries = fs.readdirSync(migrationsDir)
    .filter(entry => /^\d+/.test(entry))
    .sort()
    .reverse()

  for (const entry of migrationEntries) {
    const snapshotPath = path.join(migrationsDir, entry, 'after.schema.json')
    if (fs.existsSync(snapshotPath)) {
      return readJsonFile<SchemaSnapshot>(snapshotPath)
    }
  }

  return null
}
