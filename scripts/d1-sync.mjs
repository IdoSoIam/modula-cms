import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import Database from 'better-sqlite3'

const projectRoot = process.cwd()
const databaseName = 'ferme-du-campeyrigoux'
const appTables = [
  'SiteParams',
  'User',
  'Vegetable',
  'Basket',
  'BasketItem',
  'PickupPoint',
  'DeliveryTour',
  'TourCity',
  'Reservation',
  'ReservationScheduleProposal',
  'ReservationOccurrence',
  'ReservationNotification',
  'Article',
  'Image'
]

const mode = process.argv[2]

if (!mode) {
  throw new Error('Missing mode. Expected one of: sqlite-to-d1-local, d1-local-to-remote, d1-remote-to-local')
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ferme-d1-sync-'))

try {
  switch (mode) {
    case 'sqlite-to-d1-local':
      syncSqliteToD1Local()
      break
    case 'd1-local-to-remote':
      syncD1ToD1({ source: 'local', target: 'remote' })
      break
    case 'd1-remote-to-local':
      syncD1ToD1({ source: 'remote', target: 'local' })
      break
    default:
      throw new Error(`Unknown mode "${mode}"`)
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true })
}

function syncSqliteToD1Local() {
  runWrangler(['d1', 'migrations', 'apply', databaseName, '--local'])

  const sqlitePath = path.join(projectRoot, 'prisma', 'local.db')
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite source not found: ${sqlitePath}`)
  }

  const dataSqlPath = path.join(tempDir, 'sqlite-data.sql')
  const importSqlPath = path.join(tempDir, 'sqlite-to-d1-local.sql')

  writeSqliteDataDump(sqlitePath, dataSqlPath)
  fs.writeFileSync(importSqlPath, `${buildResetSql()}\n${fs.readFileSync(dataSqlPath, 'utf8')}`, 'utf8')

  runWrangler(['d1', 'execute', databaseName, '--local', '--file', importSqlPath, '--yes'])
  console.log('Imported prisma/local.db into local D1.')
}

function syncD1ToD1({ source, target }) {
  if (source === target) {
    throw new Error('Source and target must differ.')
  }

  runWrangler(['d1', 'migrations', 'apply', databaseName, `--${target}`])

  const exportSqlPath = path.join(tempDir, `${source}-export.sql`)
  const importSqlPath = path.join(tempDir, `${source}-to-${target}.sql`)

  runWrangler([
    'd1',
    'export',
    databaseName,
    `--${source}`,
    '--output',
    exportSqlPath,
    '--no-schema',
    '--skip-confirmation',
    ...appTables.flatMap((table) => ['--table', table])
  ])

  fs.writeFileSync(importSqlPath, `${buildResetSql()}\n${fs.readFileSync(exportSqlPath, 'utf8')}`, 'utf8')
  runWrangler(['d1', 'execute', databaseName, `--${target}`, '--file', importSqlPath, '--yes'])

  console.log(`Imported ${source} D1 data into ${target} D1.`)
}

function writeSqliteDataDump(sqlitePath, outputPath) {
  const db = new Database(sqlitePath, { readonly: true, fileMustExist: true })

  try {
    const statements = ['PRAGMA defer_foreign_keys = on;']

    for (const table of appTables) {
      const columns = db.prepare(`PRAGMA table_info("${table}")`).all()
      if (columns.length === 0) {
        throw new Error(`Table "${table}" is missing in ${sqlitePath}`)
      }

      const columnNames = columns.map((column) => column.name)
      const rows = db.prepare(`SELECT * FROM "${table}"`).all()
      if (rows.length === 0) {
        continue
      }

      const columnList = columnNames.map(quoteIdentifier).join(', ')

      for (const row of rows) {
        const values = columnNames.map((columnName) => toSqlLiteral(row[columnName])).join(', ')
        statements.push(`INSERT INTO ${quoteIdentifier(table)} (${columnList}) VALUES (${values});`)
      }
    }

    fs.writeFileSync(outputPath, `${statements.join('\n')}\n`, 'utf8')
  } finally {
    db.close()
  }
}

function buildResetSql() {
  const statements = ['PRAGMA defer_foreign_keys = on;']

  for (const table of [...appTables].reverse()) {
    statements.push(`DELETE FROM ${quoteIdentifier(table)};`)
  }

  statements.push(`DELETE FROM sqlite_sequence WHERE name IN (${appTables.map(toSqlLiteral).join(', ')});`)

  return `${statements.join('\n')}\n`
}

function toSqlLiteral(value) {
  if (value === null || value === undefined) {
    return 'NULL'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL'
  }

  if (typeof value === 'bigint') {
    return value.toString()
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0'
  }

  if (Buffer.isBuffer(value)) {
    return `X'${value.toString('hex').toUpperCase()}'`
  }

  return `'${String(value).replaceAll("'", "''")}'`
}

function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`
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
      if (/^[a-zA-Z0-9_./:-]+$/.test(part)) {
        return part
      }

      return `"${part.replaceAll('"', '\\"')}"`
    })
    .join(' ')
}
