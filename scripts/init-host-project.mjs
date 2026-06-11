#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const packageRoot = path.resolve(scriptDir, '..')
const targetDir = process.cwd()

const templateFiles = [
  ['templates/host/nuxt.config.ts', 'nuxt.config.ts'],
  ['templates/host/cms.project.config.ts', 'cms.project.config.ts'],
  ['templates/host/cms.project.generated.ts', 'cms.project.generated.ts'],
  ['wrangler.jsonc', 'wrangler.jsonc'],
  ['.env.example', '.env']
]

function writeFileIfMissing(fromRelative, toRelative) {
  const source = path.join(packageRoot, fromRelative)
  const target = path.join(targetDir, toRelative)
  if (fs.existsSync(target)) {
    return false
  }
  fs.mkdirSync(path.dirname(target), { recursive: true })
  fs.copyFileSync(source, target)
  return true
}

function ensurePackageJson() {
  const packageJsonPath = path.join(targetDir, 'package.json')
  const hasPackageJson = fs.existsSync(packageJsonPath)
  const raw = hasPackageJson
    ? fs.readFileSync(packageJsonPath, 'utf8')
    : JSON.stringify({ name: path.basename(targetDir), private: true, type: 'module' }, null, 2)
  const pkg = JSON.parse(raw)

  pkg.private ??= true
  pkg.type = 'module'
  const envPath = path.join(targetDir, '.env')
  const envRaw = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
  const runtimeTarget = /CMS_RUNTIME_TARGET\s*=\s*"?cloudflare"?/i.test(envRaw) ? 'cloudflare' : 'server'
  const dbDriver = /CMS_DB_DRIVER\s*=\s*"?d1"?/i.test(envRaw) ? 'd1' : 'sqlite'

  const baseScripts = {
    ...(pkg.scripts || {}),
    dev: pkg.scripts?.dev || 'npx nuxt dev',
    build: pkg.scripts?.build || 'npx nuxt build',
    preview: pkg.scripts?.preview || 'npx nuxt preview'
  }
  const cloudflareScripts = {
    'cms:dev:cloudflare': 'node ./node_modules/modula-cms/scripts/run-platform-command.mjs cloudflare dev',
    'cms:build:cloudflare': 'node ./node_modules/modula-cms/scripts/run-platform-command.mjs cloudflare build',
    'cms:deploy:cloudflare': 'node ./node_modules/modula-cms/scripts/run-platform-command.mjs cloudflare deploy',
    'cms:db:d1:migrate:local': 'node ./node_modules/modula-cms/scripts/d1-migrate.mjs local',
    'cms:db:d1:migrate:remote': 'node ./node_modules/modula-cms/scripts/d1-migrate.mjs remote',
    'cms:db:d1:pull:prod': 'node ./node_modules/modula-cms/scripts/d1-sync.mjs d1-remote-to-local',
    'cms:db:d1:push:prod': 'node ./node_modules/modula-cms/scripts/d1-sync.mjs d1-local-to-remote',
    'cms:r2:pull:prod': 'node ./node_modules/modula-cms/scripts/r2-sync.mjs remote-to-local',
    'cms:r2:push:prod': 'node ./node_modules/modula-cms/scripts/r2-sync.mjs local-to-remote'
  }
  const sqliteScripts = {
    'cms:db:migrate:sqlite': 'node ./node_modules/modula-cms/scripts/apply-local-migrations.mjs',
    'cms:db:reset:sqlite': 'node ./node_modules/modula-cms/scripts/apply-local-migrations.mjs --reset'
  }

  const cleanedScripts = { ...baseScripts }
  for (const key of Object.keys(cleanedScripts)) {
    if (key.startsWith('cms:')) delete cleanedScripts[key]
  }

  pkg.scripts = {
    ...cleanedScripts,
    'cms:init': 'node ./node_modules/modula-cms/scripts/init-host-project.mjs',
    'cms:reset:install': 'node ./node_modules/modula-cms/scripts/reset-host-install.mjs',
    ...(runtimeTarget === 'cloudflare' || dbDriver === 'd1' ? cloudflareScripts : {}),
    ...(runtimeTarget === 'server' || dbDriver === 'sqlite' ? sqliteScripts : {})
  }

  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
}

function ensureGitignoreEntries() {
  const gitignorePath = path.join(targetDir, '.gitignore')
  const entries = ['.nuxt', '.output', 'node_modules', '.env', 'cms.project.generated.ts']
  const existing = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf8') : ''
  const lines = new Set(existing.split(/\r?\n/).filter(Boolean))
  let changed = false
  for (const entry of entries) {
    if (!lines.has(entry)) {
      lines.add(entry)
      changed = true
    }
  }
  if (changed || !fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, `${Array.from(lines).join('\n')}\n`, 'utf8')
  }
}

function runPrismaGenerate() {
  const schemaPath = path.join(targetDir, 'node_modules', 'modula-cms', 'prisma', 'schema.prisma')
  const fallbackSchemaPath = path.join(packageRoot, 'prisma', 'schema.prisma')
  const resolvedSchemaPath = fs.existsSync(schemaPath) ? schemaPath : fallbackSchemaPath
  if (!fs.existsSync(resolvedSchemaPath)) {
    console.warn('! schema.prisma introuvable, generation Prisma ignoree')
    return
  }
  try {
    execSync(`npx prisma generate --schema="${resolvedSchemaPath}"`, { cwd: targetDir, stdio: 'inherit' })
  } catch (e) {
    console.warn('! generation Prisma ignoree (prisma non disponible)')
  }
}

function ensureSiteTemplateAssets() {
  const sourceDir = path.join(packageRoot, 'public', 'site-templates')
  const targetDirPublic = path.join(targetDir, 'public', 'site-templates')
  if (!fs.existsSync(sourceDir)) return
  fs.mkdirSync(targetDirPublic, { recursive: true })
  const files = fs.readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
  for (const filename of files) {
    const sourceFile = path.join(sourceDir, filename)
    const targetFile = path.join(targetDirPublic, filename)
    if (!fs.existsSync(targetFile)) {
      fs.copyFileSync(sourceFile, targetFile)
    }
  }
}

const copied = templateFiles.map(([from, to]) => ({ to, created: writeFileIfMissing(from, to) }))
ensurePackageJson()
ensureGitignoreEntries()
ensureSiteTemplateAssets()
runPrismaGenerate()

console.log(`Projet hôte initialisé dans ${targetDir}`)
for (const entry of copied) {
  console.log(`${entry.created ? 'créé' : 'conservé'} : ${entry.to}`)
}
