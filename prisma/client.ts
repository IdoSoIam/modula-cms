import { config } from 'dotenv'
import cmsProjectConfig from '../cms.project.config'
import { resolveCmsPlatformConfig } from '../shared/platform'

config()

const globalForPrisma = globalThis as unknown as {
  prisma: any | undefined
}

async function createPrismaClient() {
  const platformConfig = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
  if (platformConfig.dbDriver !== 'sqlite') {
    throw new Error(`Database driver "${platformConfig.dbDriver}" is not available through Prisma in this runtime`)
  }

  const [{ PrismaBetterSqlite3 }, PrismaClientModule] = await Promise.all([
    import('@prisma/adapter-better-sqlite3'),
    import('@prisma/client')
  ])

  const PrismaClient = PrismaClientModule.PrismaClient
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

export function getPrismaClient(): any {
  return new Proxy({}, {
    get(_, prop: string | symbol) {
      return async (...args: any[]) => {
        if (!globalForPrisma.prisma) {
          globalForPrisma.prisma = await createPrismaClient()
        }
        const value = globalForPrisma.prisma[prop]
        if (typeof value === 'function') {
          return await value.apply(globalForPrisma.prisma, args)
        }
        return value
      }
    }
  })
}

export const prisma = new Proxy({}, {
  get(_, prop: string | symbol) {
    return new Proxy(() => {}, {
      get(__, nestedProp: string | symbol) {
        return async (...args: any[]) => {
          if (!globalForPrisma.prisma) {
            globalForPrisma.prisma = await createPrismaClient()
          }
          const target = globalForPrisma.prisma[prop]
          const value = target?.[nestedProp]
          if (typeof value === 'function') {
            return await value.apply(target, args)
          }
          return value
        }
      },
      apply: async (__target, __thisArg, args) => {
        if (!globalForPrisma.prisma) {
          globalForPrisma.prisma = await createPrismaClient()
        }
        const value = globalForPrisma.prisma[prop]
        if (typeof value === 'function') {
          return await value.apply(globalForPrisma.prisma, args)
        }
        return value
      }
    })
  }
})
