#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { cmsDataSchema } from '../schema/cms-data-schema.ts'
import {
  buildSchemaSnapshot,
  diffSchemaSnapshots,
  hashSchemaSnapshot
} from '../db/schema-compiler.ts'
import { resolvePreviousSchemaSnapshot } from '../db/migration-system.ts'

const rawName = process.argv[2]
if (!rawName) {
  console.error('Usage: node --experimental-strip-types ./scripts/db-migration-scaffold.mjs <migration-name>')
  process.exit(1)
}

const migrationsDir = path.resolve(process.cwd(), 'migrations')
const migrationSlug = rawName
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '')

if (!migrationSlug) {
  throw new Error('Unable to derive a migration slug from the provided name.')
}

const nextPrefix = getNextMigrationPrefix(migrationsDir)
const migrationId = `${nextPrefix}_${migrationSlug}`
const migrationDir = path.join(migrationsDir, migrationId)
if (fs.existsSync(migrationDir)) {
  throw new Error(`Migration already exists: ${migrationDir}`)
}

const previousSnapshot = resolvePreviousSchemaSnapshot(migrationsDir)
const currentSnapshot = buildSchemaSnapshot(cmsDataSchema)
const previousHash = previousSnapshot ? hashSchemaSnapshot(previousSnapshot) : null
const currentHash = hashSchemaSnapshot(currentSnapshot)
const diff = diffSchemaSnapshots(previousSnapshot, currentSnapshot)

fs.mkdirSync(migrationDir, { recursive: true })

const manifest = {
  id: migrationId,
  name: migrationSlug,
  description: '',
  beforeSchemaHash: previousHash,
  afterSchemaHash: currentHash,
  up: {
    sqlite: 'sqlite.sql',
    d1: 'd1.sql'
  },
  down: {},
  summary: diff
}

fs.writeFileSync(path.join(migrationDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(migrationDir, 'before.schema.json'), `${JSON.stringify(previousSnapshot || { models: {} }, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(migrationDir, 'after.schema.json'), `${JSON.stringify(currentSnapshot, null, 2)}\n`, 'utf8')
fs.writeFileSync(path.join(migrationDir, 'sqlite.sql'), renderSqlTemplate(migrationId, 'sqlite', diff), 'utf8')
fs.writeFileSync(path.join(migrationDir, 'd1.sql'), renderSqlTemplate(migrationId, 'd1', diff), 'utf8')

console.log(migrationDir)

function getNextMigrationPrefix(directoryPath) {
  const entries = fs.existsSync(directoryPath) ? fs.readdirSync(directoryPath) : []
  const numbers = entries
    .map(entry => /^(\d+)/.exec(entry)?.[1])
    .filter(Boolean)
    .map(value => Number(value))
    .filter(value => Number.isInteger(value))

  const nextNumber = (numbers.length ? Math.max(...numbers) : 0) + 1
  return String(nextNumber).padStart(4, '0')
}

function renderSqlTemplate(migrationIdValue, dialect, diffValue) {
  const lines = [
    `-- ${migrationIdValue} (${dialect})`,
    '--',
    '-- Diff summary:'
  ]

  if (diffValue.addedModels.length) {
    lines.push(`-- Added models: ${diffValue.addedModels.join(', ')}`)
  }
  if (diffValue.removedModels.length) {
    lines.push(`-- Removed models: ${diffValue.removedModels.join(', ')}`)
  }
  for (const change of diffValue.changedModels) {
    lines.push(`-- ${change.model}: ${change.changes.join('; ')}`)
  }
  if (!diffValue.addedModels.length && !diffValue.removedModels.length && !diffValue.changedModels.length) {
    lines.push('-- No structural diff detected; fill this migration manually if required.')
  }

  lines.push('')
  lines.push('-- TODO: write explicit migration SQL here.')
  lines.push('')
  return `${lines.join('\n')}\n`
}
