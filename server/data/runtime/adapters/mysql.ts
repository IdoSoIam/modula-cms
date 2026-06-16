import type { DatabaseAdapter } from '#modula/server/data/runtime/types'

export class Mysql2Adapter implements DatabaseAdapter {
  private throwUnsupported(): never {
    throw new Error('MySQL adapter is not installed yet. Add a mysql2-backed implementation before enabling CMS_DB_DRIVER=mysql.')
  }

  async query<T = Record<string, unknown>>(_sql: string, _bindings: unknown[] = []): Promise<T[]> {
    this.throwUnsupported()
  }

  async queryFirst<T = Record<string, unknown>>(_sql: string, _bindings: unknown[] = []): Promise<T | null> {
    this.throwUnsupported()
  }

  async execute(_sql: string, _bindings: unknown[] = []): Promise<{ rowsAffected?: number; lastInsertId?: number | string | null }> {
    this.throwUnsupported()
  }
}
