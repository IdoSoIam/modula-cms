import { getCloudflareRuntimeEnv } from '#modula/server/platform/runtime'
import type { DatabaseAdapter } from '#modula/server/data/runtime/types'

function getD1() {
  const db = getCloudflareRuntimeEnv()?.DB
  if (!db) {
    throw new Error('D1 database is not available in the current runtime environment')
  }
  return db
}

export class D1Adapter implements DatabaseAdapter {
  async query<T = Record<string, unknown>>(sql: string, bindings: unknown[] = []): Promise<T[]> {
    const result = await getD1().prepare(sql).bind(...bindings).all<T>()
    return Array.isArray(result.results) ? result.results : []
  }

  async queryFirst<T = Record<string, unknown>>(sql: string, bindings: unknown[] = []): Promise<T | null> {
    return await getD1().prepare(sql).bind(...bindings).first<T>() ?? null
  }

  async execute(sql: string, bindings: unknown[] = []) {
    const result = await getD1().prepare(sql).bind(...bindings).run()
    return {
      rowsAffected: Number(result.meta?.changes || 0),
      lastInsertId: result.meta?.last_row_id ?? result.meta?.lastRowId ?? null
    }
  }
}
