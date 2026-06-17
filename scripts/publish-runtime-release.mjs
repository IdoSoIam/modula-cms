import { createHash } from 'node:crypto'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'

const cwd = process.cwd()
const version = process.argv[2]

if (!version) {
  console.error('Usage: npm run release:publish -- <version>')
  process.exit(1)
}

const localEnvPath = path.join(cwd, '.env')
const localEnv = await loadEnv(localEnvPath)
const env = {
  ...localEnv,
  ...process.env
}

const archivePath = path.join(cwd, 'dist-releases', `modula-cms-runtime-${version}.tar.gz`)
const manifestPath = path.join(cwd, 'dist-releases', `modula-cms-runtime-${version}.manifest.json`)
if (!(await fileExists(archivePath))) {
  console.warn(`Archive not found: ${archivePath}`)
  console.warn(`Building release ${version} before publish...`)
  await run(`node ./scripts/build-runtime-release.mjs ${version}`)
}

if (!env.CMS_REGISTRY_URL || !env.CMS_REGISTRY_API_KEY) {
  console.error('Missing CMS_REGISTRY_URL or CMS_REGISTRY_API_KEY.')
  console.error('Define them in D:\\Works\\modula-cms\\.env or process env.')
  process.exit(1)
}

const registryUrl = String(env.CMS_REGISTRY_URL).replace(/\/$/, '')
const registryBucket = String(env.CMS_REGISTRY_R2_BUCKET || 'modula-cms-registry-assets')
const registryProjectDir = path.resolve(cwd, '..', 'modula-cms-registry')
const registryConfigPath = path.join(registryProjectDir, 'wrangler.jsonc')
const registrySource = process.env.CMS_REGISTRY_URL
  ? 'process env'
  : localEnvPath

console.log(`Publishing ${version} to registry: ${registryUrl}`)
console.log(`Registry config source: ${registrySource}`)
if (registryUrl.includes('127.0.0.1') || registryUrl.includes('localhost')) {
  console.warn('Warning: release is being published to a local registry, not the remote Cloudflare Worker.')
}

const bytes = await readFile(archivePath)
const releaseManifest = await readJson(manifestPath, {
  version,
  builtAt: new Date().toISOString(),
  packageName: 'modula-cms'
})
const checksum = createHash('sha256').update(bytes).digest('hex')
const artifactKey = `releases/${version}/${path.basename(archivePath)}`

console.log(`Uploading artifact to R2: ${registryBucket}/${artifactKey}`)
await run(`npx wrangler r2 object put "${registryBucket}/${artifactKey}" --file "${archivePath}" --remote --config "${registryConfigPath}" --cwd "${registryProjectDir}"`)

const payload = {
  version,
  channel: env.CMS_RELEASE_CHANNEL || 'stable',
  checksum,
  filename: path.basename(archivePath),
  contentType: 'application/gzip',
  artifactKey,
  manifest: releaseManifest
}

const response = await fetch(`${registryUrl}/v1/releases`, {
  method: 'POST',
  headers: {
    authorization: `Bearer ${env.CMS_REGISTRY_API_KEY || ''}`,
    'content-type': 'application/json'
  },
  body: JSON.stringify(payload)
})

if (!response.ok) {
  console.error(await response.text())
  process.exit(1)
}

console.log(await response.text())

async function loadEnv(file) {
  const values = {}
  try {
    const raw = await readFile(file, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue
      const index = line.indexOf('=')
      if (index < 0) continue
      const key = line.slice(0, index).trim()
      const value = line.slice(index + 1).trim().replace(/^"|"$/g, '')
      values[key] = value
    }
  } catch {}
  return values
}

async function fileExists(file) {
  try {
    await access(file)
    return true
  } catch {
    return false
  }
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, stdio: 'inherit' })
    child.on('exit', (code) => code === 0 ? resolve(undefined) : reject(new Error(`Command failed: ${command}`)))
    child.on('error', reject)
  })
}
