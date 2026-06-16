const runtimeErrorMessage = 'Prisma SQLite adapter is disabled in the Cloudflare runtime bundle.'

export class PrismaBetterSqlite3 {
  constructor() {
    throw new Error(runtimeErrorMessage)
  }
}

export default {
  PrismaBetterSqlite3
}
