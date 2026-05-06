import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'

const projectRoot = process.cwd()
const databaseName = 'ferme-du-campeyrigoux'
const bucketName = 'ferme-du-campeyrigoux-images'
const mode = process.argv[2]

if (!mode) {
  throw new Error('Missing mode. Expected one of: local-to-remote, remote-to-local')
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ferme-r2-sync-'))

try {
  switch (mode) {
    case 'local-to-remote':
      syncR2({ source: 'local', target: 'remote' })
      break
    case 'remote-to-local':
      syncR2({ source: 'remote', target: 'local' })
      break
    default:
      throw new Error(`Unknown mode "${mode}"`)
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true })
}

function syncR2({ source, target }) {
  const filenames = getImageFilenames(source)
  if (!filenames.length) {
    console.log(`No images found in ${source} D1.`)
    return
  }

  for (const filename of filenames) {
    const tempFilePath = path.join(tempDir, sanitizeFilename(filename))
    runWrangler(['r2', 'object', 'get', `${bucketName}/${filename}`, `--${source}`, '--file', tempFilePath])
    runWrangler(['r2', 'object', 'put', `${bucketName}/${filename}`, `--${target}`, '--file', tempFilePath])
  }

  console.log(`Copied ${filenames.length} R2 object(s) from ${source} to ${target}.`)
}

function getImageFilenames(location) {
  const raw = execSync(
    buildCommand([
      'npx',
      'wrangler',
      'd1',
      'execute',
      databaseName,
      `--${location}`,
      '--command',
      'SELECT filename FROM Image ORDER BY id',
      '--json'
    ]),
    {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit']
    }
  )

  const parsed = JSON.parse(raw)
  const rows = parsed?.[0]?.results
  if (!Array.isArray(rows)) {
    throw new Error(`Unexpected JSON payload while reading ${location} D1 image filenames`)
  }

  return rows
    .map((row) => row?.filename)
    .filter((filename) => typeof filename === 'string' && filename.length > 0)
}

function sanitizeFilename(filename) {
  return filename.replace(/[<>:"/\\|?*]/g, '_')
}

function runWrangler(args) {
  execSync(buildCommand(['npx', 'wrangler', ...args]), {
    cwd: projectRoot,
    stdio: 'inherit'
  })
}

function buildCommand(parts) {
  return parts
    .map((part) => {
      if (/^[a-zA-Z0-9_./:=-]+$/.test(part)) {
        return part
      }

      return `"${part.replaceAll('"', '\\"')}"`
    })
    .join(' ')
}
