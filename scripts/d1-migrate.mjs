#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const mode = process.argv[2] === 'remote' ? 'remote' : 'local'
const cwd = process.cwd()
const wranglerConfigPath = path.resolve(cwd, 'wrangler.jsonc')
const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = path.resolve(packageRoot, 'migrations')

if (!fs.existsSync(wranglerConfigPath)) {
  console.error('[modula-cms] wrangler.jsonc introuvable dans le projet hôte.')
  process.exit(1)
}

const wranglerContent = fs.readFileSync(wranglerConfigPath, 'utf8')
const match = wranglerContent.match(/"database_name"\s*:\s*"([^"]+)"/)
const databaseName = match?.[1]

if (!databaseName) {
  console.error('[modula-cms] database_name introuvable dans wrangler.jsonc.')
  process.exit(1)
}

const remoteFlag = mode === 'remote' ? '--remote' : '--local'
const command = `npx wrangler d1 migrations apply ${databaseName} ${remoteFlag} --config "${wranglerConfigPath}" --cwd "${cwd}" ${mode === 'local' ? '--persist-to ".wrangler/state"' : ''}`
execSync(command, { cwd, stdio: 'inherit', shell: true })

