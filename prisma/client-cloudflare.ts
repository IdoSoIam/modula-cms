function createUnsupportedPrismaError() {
  return new Error('Prisma client is disabled in the Cloudflare runtime bundle. Use runtimeDb.ts or a D1 repository instead.')
}

function unsupported() {
  throw createUnsupportedPrismaError()
}

export function getPrismaClient(): never {
  unsupported()
}

export const prisma = new Proxy({}, {
  get() {
    return new Proxy(() => {}, {
      get() {
        return unsupported
      },
      apply() {
        unsupported()
      }
    })
  }
})
