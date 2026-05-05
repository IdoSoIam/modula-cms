import { defineConfig } from 'prisma/config'
import { config } from 'dotenv'

// Load .env file for Prisma CLI commands
config()

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL?.startsWith('file:')
      ? process.env.DATABASE_URL
      : 'file:./prisma/local.db',
  },
})
