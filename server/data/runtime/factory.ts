import cmsProjectConfig from '#modula/cms.project.config'
import { resolveCmsPlatformConfig } from '#modula/shared/platform'
import { generatedSchema } from '#modula/server/generated/schema.generated'
import { createDatabaseClient } from '#modula/server/data/runtime/client'
import { BetterSqliteAdapter } from '#modula/server/data/runtime/adapters/sqlite'
import { D1Adapter } from '#modula/server/data/runtime/adapters/d1'
import { PgAdapter } from '#modula/server/data/runtime/adapters/postgres'
import { Mysql2Adapter } from '#modula/server/data/runtime/adapters/mysql'
import { sqliteDialect } from '#modula/server/data/runtime/dialects/sqlite'
import { d1Dialect } from '#modula/server/data/runtime/dialects/d1'
import { postgresDialect } from '#modula/server/data/runtime/dialects/postgres'
import { mysqlDialect } from '#modula/server/data/runtime/dialects/mysql'

const globalForGeneratedDb = globalThis as typeof globalThis & {
  __modulaGeneratedDb?: ReturnType<typeof createDatabaseClient>
  __modulaGeneratedDbRuntime?: {
    client: ReturnType<typeof createDatabaseClient>
    adapter: BetterSqliteAdapter | D1Adapter | PgAdapter | Mysql2Adapter
    dialect: typeof sqliteDialect | typeof d1Dialect | typeof postgresDialect | typeof mysqlDialect
    schema: typeof generatedSchema
  }
}

export function getGeneratedDatabaseRuntime() {
  if (globalForGeneratedDb.__modulaGeneratedDbRuntime) {
    return globalForGeneratedDb.__modulaGeneratedDbRuntime
  }
  const platformConfig = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  switch (platformConfig.dbDriver) {
    case 'd1':
      globalForGeneratedDb.__modulaGeneratedDbRuntime = {
        schema: generatedSchema,
        adapter: new D1Adapter(),
        dialect: d1Dialect,
        client: createDatabaseClient({
          schema: generatedSchema,
          adapter: new D1Adapter(),
          dialect: d1Dialect
        })
      }
      break
    case 'postgres':
      globalForGeneratedDb.__modulaGeneratedDbRuntime = {
        schema: generatedSchema,
        adapter: new PgAdapter() as any,
        dialect: postgresDialect,
        client: createDatabaseClient({
          schema: generatedSchema,
          adapter: new PgAdapter() as any,
          dialect: postgresDialect
        })
      }
      break
    case 'mysql':
      globalForGeneratedDb.__modulaGeneratedDbRuntime = {
        schema: generatedSchema,
        adapter: new Mysql2Adapter() as any,
        dialect: mysqlDialect,
        client: createDatabaseClient({
          schema: generatedSchema,
          adapter: new Mysql2Adapter() as any,
          dialect: mysqlDialect
        })
      }
      break
    default:
      globalForGeneratedDb.__modulaGeneratedDbRuntime = {
        schema: generatedSchema,
        adapter: new BetterSqliteAdapter(),
        dialect: sqliteDialect,
        client: createDatabaseClient({
          schema: generatedSchema,
          adapter: new BetterSqliteAdapter(),
          dialect: sqliteDialect
        })
      }
      break
  }

  globalForGeneratedDb.__modulaGeneratedDb = globalForGeneratedDb.__modulaGeneratedDbRuntime.client
  return globalForGeneratedDb.__modulaGeneratedDbRuntime
}

export function getGeneratedDatabaseClient() {
  if (globalForGeneratedDb.__modulaGeneratedDb) {
    return globalForGeneratedDb.__modulaGeneratedDb
  }

  return getGeneratedDatabaseRuntime().client
}
