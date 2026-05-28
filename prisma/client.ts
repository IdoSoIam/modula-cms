import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaD1 } from '@prisma/adapter-d1'
// @prisma/client v7 uses CJS module.exports. import * as gives both type safety
// and cross-compatible CJS/ESM runtime interop (Node 22+).
import * as PrismaClientModule from '@prisma/client'

const PrismaClient = PrismaClientModule.PrismaClient
import { config } from 'dotenv'
import cmsProjectConfig from '../cms.project.config'
import { getCloudflareRuntimeEnv } from '../server/platform/runtime'
import { resolveCmsPlatformConfig } from '../shared/platform'

config()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const platformConfig = resolveCmsPlatformConfig(process.env, cmsProjectConfig)

  if (platformConfig.dbDriver === 'd1') {
    const cloudflareEnv = getCloudflareRuntimeEnv()
    if (!cloudflareEnv?.DB) {
      throw new Error('CMS_DB_DRIVER=d1 requires the Cloudflare DB binding in the current runtime')
    }
    return new PrismaClient({
      adapter: new PrismaD1(cloudflareEnv.DB)
    })
  }

  if (platformConfig.dbDriver !== 'sqlite') {
    throw new Error(`Database driver "${platformConfig.dbDriver}" is not implemented yet in this runtime`)
  }

  const connectionString = process.env.DATABASE_URL?.startsWith('file:')
    ? process.env.DATABASE_URL
    : 'file:./prisma/local.db'

  return new PrismaClient({
    adapter: new PrismaBetterSqlite3(
      { url: connectionString },
      { timestampFormat: 'iso8601' }
    )
  })
}

export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }

  return globalForPrisma.prisma
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string | symbol) {
    const client = getPrismaClient()
    return (client as any)[prop]
  }
})
