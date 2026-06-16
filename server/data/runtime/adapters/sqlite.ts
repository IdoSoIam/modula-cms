import path from 'node:path'
import type { DatabaseAdapter } from '#modula/server/data/runtime/types'

const globalForSqliteAdapter = globalThis as typeof globalThis & {
  __modulaGeneratedSqliteDb?: any
}

async function getSqliteDb() {
  if (globalForSqliteAdapter.__modulaGeneratedSqliteDb) {
    return globalForSqliteAdapter.__modulaGeneratedSqliteDb
  }

  const { default: BetterSqlite3 } = await import('better-sqlite3')
  const connectionString = process.env.DATABASE_URL?.startsWith('file:')
    ? process.env.DATABASE_URL
    : 'file:./.data/sqlite/local.db'
  const rawPath = connectionString.replace(/^file:/, '')
  const databasePath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath)
  globalForSqliteAdapter.__modulaGeneratedSqliteDb = new BetterSqlite3(databasePath)
  return globalForSqliteAdapter.__modulaGeneratedSqliteDb
}

export class BetterSqliteAdapter implements DatabaseAdapter {
  async query<T = Record<string, unknown>>(sql: string, bindings: unknown[] = []): Promise<T[]> {
    const db = await getSqliteDb()
    return db.prepare(sql).all(...bindings) as T[]
  }

  async queryFirst<T = Record<string, unknown>>(sql: string, bindings: unknown[] = []): Promise<T | null> {
    const db = await getSqliteDb()
    return (db.prepare(sql).get(...bindings) as T | undefined) ?? null
  }

  async execute(sql: string, bindings: unknown[] = []) {
    const db = await getSqliteDb()
    const result = db.prepare(sql).run(...bindings)
    return {
      rowsAffected: Number(result.changes || 0),
      lastInsertId: result.lastInsertRowid == null ? null : Number(result.lastInsertRowid)
    }
  }
}
