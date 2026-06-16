#!/usr/bin/env node
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const wranglerBin = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'node_modules',
  'wrangler',
  'bin',
  'wrangler.js'
)
import {
  getMigrationSql,
  getSqliteMigrationStatus,
  loadResolvedMigrations,
  renderMigrationStateTableSql,
  applySqliteMigrations
} from '../db/migration-system.ts'
import {
  d1BootstrapSql,
  schemaSnapshotHash,
  sqliteBootstrapSql
} from '../server/generated/bootstrap.generated.ts'

const [target, modeOrFlag, ...restArgs] = process.argv.slice(2)

if (!target || !['sqlite', 'd1'].includes(target)) {
  console.error('Usage: node --experimental-strip-types ./scripts/db-migrate.mjs <sqlite|d1> [local|remote] [--status] [--reset]')
  process.exit(1)
}

const args = new Set([modeOrFlag, ...restArgs].filter(Boolean))

if (target === 'sqlite') {
  await runSqlite(args)
} else {
  await runD1(modeOrFlag === 'remote' ? 'remote' : 'local', args)
}

async function runSqlite(argsSet) {
  const projectRoot = process.cwd()
  const databasePath = resolveSqliteDatabasePath()
  const migrationsDir = path.join(projectRoot, 'migrations')

  if (argsSet.has('--reset') && fs.existsSync(databasePath)) {
    fs.rmSync(databasePath, { force: true })
  }

  if (argsSet.has('--status')) {
    const status = await getSqliteMigrationStatus({
      databasePath,
      migrationsDir,
      bootstrapSql: sqliteBootstrapSql,
      schemaHash: schemaSnapshotHash
    })
    console.log(JSON.stringify(status, null, 2))
    return
  }

  await applySqliteMigrations({
    databasePath,
    migrationsDir,
    bootstrapSql: sqliteBootstrapSql,
    schemaHash: schemaSnapshotHash
  })

  console.log(databasePath)
}

async function runD1(location, argsSet) {
  const projectRoot = process.cwd()
  const migrationsDir = path.join(projectRoot, 'migrations')
  const databaseName = resolveWranglerDatabaseName(projectRoot)
  const migrations = loadResolvedMigrations(migrationsDir)
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'modula-cms-d1-migrate-'))

  try {
    ensureD1MigrationTable(databaseName, location, projectRoot)
    const tables = listD1Tables(databaseName, location, projectRoot)
    const appliedIds = new Set(listD1AppliedIds(databaseName, location, projectRoot))

    if (appliedIds.size === 0) {
      const userTables = tables.filter(name => !['d1_migrations', '_cms_migrations'].includes(name))
      if (userTables.length === 0) {
        const bootstrapFile = path.join(tempDir, `bootstrap-${location}.sql`)
        fs.writeFileSync(
          bootstrapFile,
          [
            d1BootstrapSql.trim(),
            '',
            renderMigrationStateTableSql(),
            '',
            renderMigrationMarks(migrations, 'bootstrap', schemaSnapshotHash)
          ].join('\n'),
          'utf8'
        )
        runWranglerExecuteFile(databaseName, location, projectRoot, bootstrapFile)
        appliedIds.clear()
        for (const migration of migrations) appliedIds.add(migration.id)
      } else {
        const baselineFile = path.join(tempDir, `baseline-${location}.sql`)
        fs.writeFileSync(
          baselineFile,
          renderMigrationMarks(migrations, 'legacy-baseline', schemaSnapshotHash),
          'utf8'
        )
        runWranglerExecuteFile(databaseName, location, projectRoot, baselineFile)
        appliedIds.clear()
        for (const migration of migrations) appliedIds.add(migration.id)
      }
    }

    const pending = migrations.filter(migration => !appliedIds.has(migration.id))
    if (argsSet.has('--status')) {
      console.log(JSON.stringify({
        appliedIds: [...appliedIds].sort(),
        pendingIds: pending.map(migration => migration.id)
      }, null, 2))
      return
    }

    for (const migration of pending) {
      const sql = getMigrationSql(migration, 'd1')
      const filePath = path.join(tempDir, `${migration.id}.sql`)
      fs.writeFileSync(
        filePath,
        [
          sql.trim(),
          '',
          renderMigrationMarks([migration], 'migration', migration.afterSchemaHash || schemaSnapshotHash)
        ].join('\n'),
        'utf8'
      )
      runWranglerExecuteFile(databaseName, location, projectRoot, filePath)
    }

    console.log(`${databaseName}:${location}`)
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}

function resolveSqliteDatabasePath() {
  const connectionString = process.env.DATABASE_URL?.startsWith('file:')
    ? process.env.DATABASE_URL
    : 'file:./.data/sqlite/local.db'
  const rawPath = connectionString.replace(/^file:/, '')
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
}

function resolveWranglerDatabaseName(projectRoot) {
  const wranglerConfigPath = path.resolve(projectRoot, 'wrangler.jsonc')
  if (!fs.existsSync(wranglerConfigPath)) {
    throw new Error('[modula-cms] wrangler.jsonc introuvable dans le projet hôte.')
  }

  const wranglerContent = fs.readFileSync(wranglerConfigPath, 'utf8')
  const match = wranglerContent.match(/"database_name"\s*:\s*"([^"]+)"/)
  const databaseName = match?.[1]
  if (!databaseName) {
    throw new Error('[modula-cms] database_name introuvable dans wrangler.jsonc.')
  }

  return databaseName
}

function ensureD1MigrationTable(databaseName, location, projectRoot) {
  runWranglerExecuteCommand(
    databaseName,
    location,
    projectRoot,
    renderMigrationStateTableSql()
  )
}

function listD1Tables(databaseName, location, projectRoot) {
  const rows = runWranglerJson(databaseName, location, projectRoot, `
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name ASC
  `)

  return rows
    .map(row => row?.name)
    .filter(name => typeof name === 'string' && name.length > 0)
}

function listD1AppliedIds(databaseName, location, projectRoot) {
  const migrationRows = runWranglerJson(
    databaseName,
    location,
    projectRoot,
    `SELECT id FROM "_cms_migrations" ORDER BY id ASC`
  )

  if (migrationRows.length) {
    return migrationRows
      .map(row => row?.id)
      .filter(id => typeof id === 'string' && id.length > 0)
  }

  const legacyRows = runWranglerJson(
    databaseName,
    location,
    projectRoot,
    `SELECT name FROM "d1_migrations" ORDER BY name ASC`
  )

  return legacyRows
    .map(row => row?.name)
    .filter(name => typeof name === 'string' && name.length > 0)
    .map(name => String(name).replace(/\.sql$/i, ''))
}

function renderMigrationMarks(migrations, source, schemaHash) {
  return migrations.map((migration) => {
    const escapedId = escapeSqlLiteral(migration.id)
    const escapedName = escapeSqlLiteral(migration.name)
    const escapedSource = escapeSqlLiteral(source)
    const escapedHash = schemaHash ? `'${escapeSqlLiteral(schemaHash)}'` : 'NULL'
    return `INSERT OR IGNORE INTO "_cms_migrations" ("id", "name", "source", "schemaHash") VALUES ('${escapedId}', '${escapedName}', '${escapedSource}', ${escapedHash});`
  }).join('\n')
}

function runWranglerJson(databaseName, location, projectRoot, command) {
  try {
    const result = spawnSync(
      process.execPath,
      [
        wranglerBin,
        'd1',
        'execute',
        databaseName,
        `--${location}`,
        '--command',
        command,
        '--json',
        ...getLocationFlags(location)
      ],
      {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'inherit']
      }
    )

    if (result.status !== 0) {
      const stderr = (result.stderr || '').trim()
      if (/no such table/i.test(stderr)) {
        return []
      }
      throw new Error(stderr || `wrangler exited with code ${result.status}`)
    }

    const raw = (result.stdout || '').trim()
    if (!raw) return []

    const parsed = JSON.parse(raw)
    const rows = parsed?.[0]?.results
    return Array.isArray(rows) ? rows : []
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/no such table/i.test(message)) {
      return []
    }
    throw error
  }
}

function runWranglerExecuteCommand(databaseName, location, projectRoot, command) {
  const result = spawnSync(
    process.execPath,
    [
      wranglerBin,
      'd1',
      'execute',
      databaseName,
      `--${location}`,
      '--command',
      command,
      ...getLocationFlags(location)
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit'
    }
  )

  if (result.status !== 0) {
    throw new Error(`wrangler exited with code ${result.status}`)
  }
}

function runWranglerExecuteFile(databaseName, location, projectRoot, filePath) {
  const result = spawnSync(
    process.execPath,
    [
      wranglerBin,
      'd1',
      'execute',
      databaseName,
      `--${location}`,
      '--file',
      filePath,
      '--yes',
      ...getLocationFlags(location)
    ],
    {
      cwd: projectRoot,
      stdio: 'inherit'
    }
  )

  if (result.status !== 0) {
    throw new Error(`wrangler exited with code ${result.status}`)
  }
}

function getLocationFlags(location) {
  return location === 'local'
    ? ['--persist-to', '.wrangler/state']
    : []
}

function escapeSqlLiteral(value) {
  return String(value).replaceAll("'", "''")
}
