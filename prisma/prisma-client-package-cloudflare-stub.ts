const runtimeErrorMessage = 'Prisma package is disabled in the Cloudflare runtime bundle. Use D1 runtime repositories instead.'

export class PrismaClient {
  constructor() {
    throw new Error(runtimeErrorMessage)
  }
}

export const Prisma = {}

export default {
  PrismaClient,
  Prisma
}
