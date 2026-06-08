import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const cwd = process.cwd()
const env = await loadEnv(path.join(cwd, '.env'))
const version = process.argv[2]
if (!version) {
  console.error('Usage: npm run release:publish -- <version>')
  process.exit(1)
}

const archivePath = path.join(cwd, 'dist-releases', `modula-cms-runtime-${version}.tar.gz`)
const bytes = await readFile(archivePath)
const checksum = createHash('sha256').update(bytes).digest('hex')
const payload = {
  version,
  channel: env.CMS_RELEASE_CHANNEL || 'stable',
  checksum,
  filename: path.basename(archivePath),
  contentType: 'application/gzip',
  dataBase64: bytes.toString('base64'),
  manifest: {
    packageName: 'modula-cms',
    builtAt: new Date().toISOString()
  }
}

const response = await fetch(`${(env.CMS_REGISTRY_URL || '').replace(/\/$/, '')}/v1/releases`, {
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
