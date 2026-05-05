import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaD1 } from '@prisma/adapter-d1'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const cloudflareEnv = (globalThis as { __env__?: { DB?: D1Database } }).__env__

  if (cloudflareEnv?.DB) {
    return new PrismaClient({
      adapter: new PrismaD1(cloudflareEnv.DB)
    })
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
