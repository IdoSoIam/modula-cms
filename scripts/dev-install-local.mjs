#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const cwd = process.cwd()
const shouldReset = process.argv.includes('--reset')

const localDbPath = path.resolve(cwd, 'prisma', 'local.db')
const wranglerStatePath = path.resolve(cwd, '.wrangler', 'state')
const generatedConfigPath = path.resolve(cwd, 'cms.project.generated.ts')

function resetLocalInstallState() {
  if (fs.existsSync(localDbPath)) fs.rmSync(localDbPath, { force: true })
  if (fs.existsSync(wranglerStatePath)) fs.rmSync(wranglerStatePath, { recursive: true, force: true })
  const generatedPlaceholder = [
    "import type { CmsProjectConfig } from './shared/platform'",
    '',
    'const generatedProjectConfig: CmsProjectConfig | undefined = undefined',
    '',
    'export default generatedProjectConfig',
    ''
  ].join('\n')
  fs.writeFileSync(generatedConfigPath, generatedPlaceholder, 'utf8')
}

if (shouldReset) {
  resetLocalInstallState()
  console.log('[modula-cms] état install local réinitialisé.')
}

const env = {
  ...process.env,
  CMS_RUNTIME_TARGET: 'server',
  CMS_DB_DRIVER: 'sqlite',
  CMS_STORAGE_DRIVER: 'fs',
  IMAGE_STORAGE_DRIVER: 'filesystem',
  IMAGE_DELIVERY_MODE: 'ipx',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/local.db'
}

const child = spawn('npx', ['nuxt', 'dev'], {
  cwd,
  env,
  stdio: 'inherit',
  shell: true
})

child.on('exit', (code) => {
  process.exit(code ?? 0)
})

