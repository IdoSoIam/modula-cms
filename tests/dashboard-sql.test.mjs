import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import Database from 'better-sqlite3'
import { Miniflare } from 'miniflare'
import { normalizeDistribution } from '../shared/dashboard.ts'

// Execute the service SQL against both engines, without touching site data.
const source = await readFile(new URL('../server/services/dashboard/getDashboardStats.ts', import.meta.url), 'utf8')
const queries = [...source.matchAll(/`(SELECT[\s\S]*?)`/g)].map(match => match[1])
assert.equal(queries.length, 3)
const schema = [
  'CREATE TABLE Event (id INTEGER PRIMARY KEY, status TEXT, recurrenceType TEXT, startsAt TEXT)',
  'CREATE TABLE EventOccurrence (eventId INTEGER, status TEXT, startsAt TEXT)',
  'CREATE TABLE ShopOrder (status TEXT, paymentStatus TEXT)',
  'CREATE TABLE CmsPage (status TEXT)'
]
const fixtures = [
  "INSERT INTO Event VALUES (1,'PUBLISHED','NONE','2026-09-10T08:00:00.000Z'), (2,'DRAFT','NONE','2026-09-10T08:00:00.000Z'), (3,'PUBLISHED','WEEKLY','2025-01-01T08:00:00.000Z'), (4,'CANCELLED','NONE','2026-09-10T08:00:00.000Z'), (5,'PUBLISHED','WEEKLY','2025-01-01T08:00:00.000Z')",
  "INSERT INTO EventOccurrence VALUES (3,'SCHEDULED','2026-09-12T08:00:00.000Z'), (3,'SCHEDULED','2026-09-19T08:00:00.000Z'), (5,'CANCELLED','2026-09-12T08:00:00.000Z')",
  "INSERT INTO ShopOrder VALUES ('PENDING','UNPAID'), ('CONFIRMED','PAID'), ('CANCELLED','REFUNDED')"
]
const bindings = ['2026-09-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z', '2026-09-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z']
async function verify(query, execute) {
  for (const sql of schema) await execute(sql)
  assert.deepEqual(await query(queries[0].replace('${table}', 'Event')), [])
  assert.deepEqual(await query(queries[2]), [{ pending: 0, paid: 0, cancelled: 0 }])
  for (const sql of fixtures) await execute(sql)
  assert.deepEqual(await query(queries[1], bindings), [{ count: 2 }])
  assert.deepEqual(await query(queries[2]), [{ pending: 1, paid: 1, cancelled: 1 }])
  const rows = await query(queries[0].replace('${table}', 'Event'))
  assert.deepEqual(normalizeDistribution(rows, ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED']).map(item => item.value), [1, 3, 0, 1])
}
test('dashboard aggregates in SQLite without loading records', async () => {
  const db = new Database(':memory:')
  try { await verify((sql, values = []) => db.prepare(sql).all(...values), sql => db.exec(sql)) } finally { db.close() }
})
test('same dashboard queries on local D1', async () => {
  const mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("test") } }', d1Databases: ['DB'], compatibilityDate: '2026-06-01' })
  try {
    const db = await mf.getD1Database('DB')
    await verify(async (sql, values = []) => (await db.prepare(sql).bind(...values).all()).results, sql => db.prepare(sql).run())
  } finally { await mf.dispose() }
})
