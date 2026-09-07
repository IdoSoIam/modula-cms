import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

export function normalizeRuntimeMigrationPath(value) {
  return String(value || '').replace(/\\/g, '/')
}

export async function listRuntimeMigrationFiles(migrationsDir, dialect = 'sqlite') {
  if (!existsSync(migrationsDir)) return []

  const entries = await readdir(migrationsDir, { withFileTypes: true })
  const migrations = entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.sql'))
    .map(entry => entry.name)

  for (const entry of entries.filter(candidate => candidate.isDirectory())) {
    const manifestFile = path.join(migrationsDir, entry.name, 'manifest.json')
    if (!existsSync(manifestFile)) continue

    const manifest = JSON.parse(await readFile(manifestFile, 'utf8'))
    const relativeSqlFile = manifest?.up?.[dialect]
    if (!relativeSqlFile) continue

    const migrationPath = normalizeRuntimeMigrationPath(path.posix.join(entry.name, relativeSqlFile))
    if (path.isAbsolute(migrationPath) || migrationPath.split('/').includes('..') || !migrationPath.endsWith('.sql')) {
      throw new Error(`Invalid ${dialect} migration path in ${manifestFile}`)
    }
    if (!existsSync(path.join(migrationsDir, ...migrationPath.split('/')))) {
      throw new Error(`Missing ${dialect} migration file: ${migrationPath}`)
    }
    migrations.push(migrationPath)
  }

  return [...new Set(migrations.map(normalizeRuntimeMigrationPath))].sort()
}

export function normalizeRuntimeManifestMigrations(manifest) {
  const items = Array.isArray(manifest?.migrations) ? manifest.migrations : []
  return items
    .map(item => typeof item === 'string' ? item : item?.name)
    .filter(Boolean)
    .map(normalizeRuntimeMigrationPath)
    .sort()
}

export async function buildRuntimeMigrationManifest(migrationsDir, dialect = 'sqlite') {
  const migrations = await listRuntimeMigrationFiles(migrationsDir, dialect)
  return await Promise.all(migrations.map(async (name) => {
    const contents = await readFile(path.join(migrationsDir, ...name.split('/')), 'utf8')
    return {
      name,
      checksum: createHash('sha256').update(contents).digest('hex')
    }
  }))
}
