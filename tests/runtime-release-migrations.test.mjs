import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'

import {
  buildRuntimeMigrationManifest,
  listRuntimeMigrationFiles,
  normalizeRuntimeManifestMigrations
} from '../scripts/runtime-migrations.mjs'

const migrationsDir = path.resolve('migrations')

test('runtime releases include legacy and modern SQLite migrations', async () => {
  const files = await listRuntimeMigrationFiles(migrationsDir)

  assert.ok(files.includes('0029_add_billing_document_invoice_columns.sql'))
  assert.ok(files.includes('0030_add_billing_document_invoice_options/sqlite.sql'))
  assert.ok(files.includes('0031_add_shop_order_refund_rules/sqlite.sql'))
  assert.ok(files.includes('0032_add_event_notification_locale/sqlite.sql'))
  assert.equal(files.some(file => file.endsWith('/d1.sql')), false)
})

test('runtime release manifest checksums every selected migration', async () => {
  const manifest = await buildRuntimeMigrationManifest(migrationsDir)
  const names = normalizeRuntimeManifestMigrations({ migrations: manifest })

  assert.equal(names.length, manifest.length)
  for (const migration of manifest) {
    const contents = await readFile(path.join(migrationsDir, ...migration.name.split('/')), 'utf8')
    assert.equal(migration.checksum, createHash('sha256').update(contents).digest('hex'))
  }
})
