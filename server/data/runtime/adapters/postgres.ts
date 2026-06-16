import type { DatabaseAdapter } from '#modula/server/data/runtime/types'

export class PgAdapter implements DatabaseAdapter {
  private throwUnsupported(): never {
    throw new Error('PostgreSQL adapter is not installed yet. Add a pg-backed implementation before enabling CMS_DB_DRIVER=postgres.')
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
