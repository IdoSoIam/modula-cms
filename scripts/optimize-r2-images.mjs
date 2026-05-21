import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import sharp from 'sharp'

const projectRoot = process.cwd()
const databaseName = 'ferme-du-campeyrigoux'
const bucketName = 'ferme-du-campeyrigoux-images'
const args = new Set(process.argv.slice(2))
const location = args.has('--local') ? 'local' : 'remote'
const dryRun = args.has('--dry-run')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ferme-r2-optimize-'))

try {
  const rows = getImageRows(location).filter(shouldOptimizeRow)

  if (!rows.length) {
    console.log(`No jpg/jpeg/png images found in ${location} D1.`)
    process.exit(0)
  }

  let optimizedCount = 0
  let skippedCount = 0
  let errorCount = 0
  let savedBytes = 0

  for (const row of rows) {
    const tempFilePath = path.join(tempDir, sanitizeFilename(row.filename))

    try {
      runWrangler(['r2', 'object', 'get', `${bucketName}/${row.filename}`, `--${location}`, '--file', tempFilePath])
      const originalBuffer = fs.readFileSync(tempFilePath)
      const result = await optimizeBuffer({
        buffer: originalBuffer,
        filename: row.filename
      })

      const byteDelta = originalBuffer.byteLength - result.buffer.byteLength
      const metadataChanged = row.size !== result.buffer.byteLength || row.width !== result.width || row.height !== result.height
      const bodyChanged = byteDelta > 0

      if (!bodyChanged && !metadataChanged) {
        skippedCount += 1
        console.log(`SKIP ${row.filename} (no gain)`)
        continue
      }

      if (dryRun) {
        optimizedCount += 1
        savedBytes += Math.max(0, byteDelta)
        console.log(`DRY  ${row.filename} ${formatBytes(originalBuffer.byteLength)} -> ${formatBytes(result.buffer.byteLength)} (${formatDelta(byteDelta)})`)
        continue
      }

      fs.writeFileSync(tempFilePath, result.buffer)
      runWrangler(['r2', 'object', 'put', `${bucketName}/${row.filename}`, `--${location}`, '--file', tempFilePath])
      updateImageRow(location, row.id, {
        size: result.buffer.byteLength,
        width: result.width,
        height: result.height,
        mimeType: result.mimeType
      })

      optimizedCount += 1
      savedBytes += Math.max(0, byteDelta)
      console.log(`DONE ${row.filename} ${formatBytes(originalBuffer.byteLength)} -> ${formatBytes(result.buffer.byteLength)} (${formatDelta(byteDelta)})`)
    } catch (error) {
      errorCount += 1
      console.error(`FAIL ${row.filename}`)
      console.error(error instanceof Error ? error.message : error)
    } finally {
      fs.rmSync(tempFilePath, { force: true })
    }
  }

  console.log('')
  console.log(`Location: ${location}`)
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`)
  console.log(`Optimized: ${optimizedCount}`)
  console.log(`Skipped: ${skippedCount}`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Saved: ${formatBytes(savedBytes)}`)
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true })
}

function shouldOptimizeRow(row) {
  if (!row?.filename || typeof row.filename !== 'string') return false
  if (/favicon/i.test(row.filename)) return false
  return /\.(png|jpe?g)$/i.test(row.filename)
}

async function optimizeBuffer({ buffer, filename }) {
  const mimeType = guessMimeType(filename)
  const pipeline = sharp(buffer, { failOn: 'none' }).rotate()
  const metadata = await pipeline.metadata()
  const width = typeof metadata.width === 'number' ? metadata.width : null
  const height = typeof metadata.height === 'number' ? metadata.height : null

  let optimizedBuffer
  if (mimeType === 'image/jpeg') {
    optimizedBuffer = await pipeline
      .jpeg({
        quality: 82,
        mozjpeg: true,
        progressive: true
      })
      .toBuffer()
  } else {
    optimizedBuffer = await pipeline
      .png({
        compressionLevel: 9,
        adaptiveFiltering: true,
        effort: 10,
        palette: true,
        quality: 82
      })
      .toBuffer()
  }

  const finalBuffer = optimizedBuffer.byteLength <= buffer.byteLength ? optimizedBuffer : buffer

  return {
    buffer: finalBuffer,
    width,
    height,
    mimeType
  }
}

function getImageRows(targetLocation) {
  const raw = execSync(
    buildCommand([
      'npx',
      'wrangler',
      'd1',
      'execute',
      databaseName,
      `--${targetLocation}`,
      '--command',
      'SELECT id, filename, mimeType, size, width, height FROM Image ORDER BY id',
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
    throw new Error(`Unexpected JSON payload while reading ${targetLocation} D1 images`)
  }

  return rows
}

function updateImageRow(targetLocation, id, values) {
  const sql = [
    'UPDATE Image',
    `SET size = ${Number(values.size)},`,
    `width = ${toSqlNumber(values.width)},`,
    `height = ${toSqlNumber(values.height)},`,
    `mimeType = '${escapeSql(values.mimeType)}'`,
    `WHERE id = ${Number(id)}`
  ].join(' ')

  runWrangler([
    'd1',
    'execute',
    databaseName,
    `--${targetLocation}`,
    '--command',
    sql
  ])
}

function toSqlNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : 'NULL'
}

function guessMimeType(filename) {
  return /\.jpe?g$/i.test(filename) ? 'image/jpeg' : 'image/png'
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''")
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

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDelta(bytes) {
  const prefix = bytes >= 0 ? '-' : '+'
  return `${prefix}${formatBytes(Math.abs(bytes))}`
}
