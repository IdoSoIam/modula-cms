import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import Database from 'better-sqlite3'

const projectRoot = process.cwd()
const databaseName = 'ferme-du-campeyrigoux'
const appTables = [
  'd1_migrations',
  'SiteParams',
  'Role',
  'RolePermission',
  'MemberRole',
  'User',
  'PasswordSetupToken',
  'UserMemberRole',
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
  'Image',
  'ImageVariant',
  'ImageUsage',
  'CmsPage',
  'CmsNavigationItem',
  'Event',
  'EventOccurrence',
  'EventAudienceMemberRole',
  'EventPublicReservation',
  'EventInternalParticipation'
]
const userScopedTables = [
  'User',
  'PasswordSetupToken',
  'UserMemberRole',
  'Reservation',
  'ReservationScheduleProposal',
  'ReservationOccurrence',
  'ReservationNotification',
  'Article',
  'Image',
  'Event',
  'EventOccurrence',
  'EventAudienceMemberRole',
  'EventPublicReservation',
  'EventInternalParticipation'
]
const protectedRemoteSiteParamKeys = [
  'gmail_sender_email',
  'gmail_refresh_token',
  'gmail_access_token',
  'gmail_token_expiry',
  'gmail_connected_email',
  'google_calendar_id',
  'google_calendar_name'
]

const mode = process.argv[2]

if (!mode) {
  throw new Error('Missing mode. Expected one of: sqlite-to-d1-local, sql-file-to-d1-local, d1-local-to-remote, d1-remote-to-local')
}

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ferme-d1-sync-'))

try {
  switch (mode) {
    case 'sqlite-to-d1-local':
      syncSqliteToD1Local()
      break
    case 'sql-file-to-d1-local':
      syncSqlFileToD1Local(process.argv[3])
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
  const syncPlan = createSyncPlan({ source: 'sqlite', target: 'local' })

  writeSqliteDataDump(sqlitePath, dataSqlPath, syncPlan)
  fs.writeFileSync(importSqlPath, `${buildResetSql(syncPlan)}\n${fs.readFileSync(dataSqlPath, 'utf8')}`, 'utf8')

  runWrangler(['d1', 'execute', databaseName, '--local', '--file', importSqlPath, '--yes'])
  console.log('Imported prisma/local.db into local D1.')
}

function syncSqlFileToD1Local(inputPathArg) {
  runWrangler(['d1', 'migrations', 'apply', databaseName, '--local'])

  const inputPath = inputPathArg
    ? path.resolve(projectRoot, inputPathArg)
    : path.join(projectRoot, 'database.sql')
  if (!fs.existsSync(inputPath)) {
    throw new Error(`SQL source not found: ${inputPath}`)
  }

  const sqlitePath = path.join(tempDir, 'sql-import-buffer.db')
  const dataSqlPath = path.join(tempDir, 'sql-file-data.sql')
  const importSqlPath = path.join(tempDir, 'sql-file-to-d1-local.sql')
  const syncPlan = createSyncPlan({ source: 'sql-file', target: 'local' })

  materializeSqlFileToSqlite(inputPath, sqlitePath)
  writeSqliteDataDump(sqlitePath, dataSqlPath, syncPlan)
  fs.writeFileSync(importSqlPath, `${buildResetSql(syncPlan)}\n${fs.readFileSync(dataSqlPath, 'utf8')}`, 'utf8')

  runWrangler(['d1', 'execute', databaseName, '--local', '--file', importSqlPath, '--yes'])
  console.log(`Imported ${inputPath} into local D1.`)
}

function syncD1ToD1({ source, target }) {
  if (source === target) {
    throw new Error('Source and target must differ.')
  }

  runWrangler(['d1', 'migrations', 'apply', databaseName, `--${target}`])

  const exportSqlPath = path.join(tempDir, `${source}-export.sql`)
  const importSqlPath = path.join(tempDir, `${source}-to-${target}.sql`)
  const syncPlan = createSyncPlan({ source, target })

  runWrangler([
    'd1',
    'export',
    databaseName,
    `--${source}`,
    '--output',
    exportSqlPath,
    '--no-schema',
    '--skip-confirmation',
    ...syncPlan.exportTables.flatMap((table) => ['--table', table])
  ])

  const exportSql = fs.readFileSync(exportSqlPath, 'utf8')
  const filteredExportSql = transformExportSql(exportSql, syncPlan)
  fs.writeFileSync(importSqlPath, `${buildResetSql(syncPlan)}\n${filteredExportSql}`, 'utf8')
  runWrangler(['d1', 'execute', databaseName, `--${target}`, '--file', importSqlPath, '--yes'])

  console.log(`Imported ${source} D1 data into ${target} D1.`)
}

function createSyncPlan({ source, target }) {
  if (source === 'local' && target === 'remote') {
    return {
      exportTables: appTables.filter((table) => !userScopedTables.includes(table)),
      resetTables: appTables.filter((table) => !userScopedTables.includes(table)),
      preserveSiteParamKeys: protectedRemoteSiteParamKeys,
      columnOverrides: {
        SiteParams: { id: null },
        Article: { authorId: null },
        Image: { uploadedById: null }
      }
    }
  }

  return {
    exportTables: appTables,
    resetTables: appTables,
    preserveSiteParamKeys: [],
    columnOverrides: {}
  }
}

function materializeSqlFileToSqlite(inputPath, sqlitePath) {
  const db = new Database(sqlitePath)

  try {
    db.exec('PRAGMA foreign_keys = OFF')
    db.exec(fs.readFileSync(inputPath, 'utf8'))
    db.exec('PRAGMA foreign_keys = ON')
  } finally {
    db.close()
  }
}

function writeSqliteDataDump(sqlitePath, outputPath, syncPlan) {
  const db = new Database(sqlitePath, { readonly: true, fileMustExist: true })

  try {
    const statements = ['PRAGMA defer_foreign_keys = on;']

    for (const table of syncPlan.exportTables) {
      const columns = db.prepare(`PRAGMA table_info("${table}")`).all()
      if (columns.length === 0) {
        throw new Error(`Table "${table}" is missing in ${sqlitePath}`)
      }

      const columnNames = columns.map((column) => column.name)
      const rows = db.prepare(buildSelectSql(table, syncPlan)).all()
      if (rows.length === 0) {
        continue
      }

      const columnList = columnNames.map(quoteIdentifier).join(', ')

      for (const row of rows) {
        const values = columnNames.map((columnName) => {
          const overrideValue = syncPlan.columnOverrides[table]?.[columnName]
          return toSqlLiteral(overrideValue === undefined ? row[columnName] : overrideValue)
        }).join(', ')
        statements.push(`INSERT INTO ${quoteIdentifier(table)} (${columnList}) VALUES (${values});`)
      }
    }

    fs.writeFileSync(outputPath, `${statements.join('\n')}\n`, 'utf8')
  } finally {
    db.close()
  }
}

function buildSelectSql(table, syncPlan) {
  if (table === 'SiteParams' && syncPlan.preserveSiteParamKeys.length > 0) {
    return `SELECT * FROM "${table}" WHERE "key" NOT IN (${syncPlan.preserveSiteParamKeys.map(toSqlLiteral).join(', ')})`
  }

  return `SELECT * FROM "${table}"`
}

function buildResetSql(syncPlan) {
  const statements = ['PRAGMA defer_foreign_keys = on;']
  const fullyResetTables = []

  for (const table of [...syncPlan.resetTables].reverse()) {
    if (table === 'SiteParams' && syncPlan.preserveSiteParamKeys.length > 0) {
      statements.push(`DELETE FROM ${quoteIdentifier(table)} WHERE "key" NOT IN (${syncPlan.preserveSiteParamKeys.map(toSqlLiteral).join(', ')});`)
      continue
    }

    statements.push(`DELETE FROM ${quoteIdentifier(table)};`)
    fullyResetTables.push(table)
  }

  if (fullyResetTables.length > 0) {
    statements.push(`DELETE FROM sqlite_sequence WHERE name IN (${fullyResetTables.map(toSqlLiteral).join(', ')});`)
  }

  return `${statements.join('\n')}\n`
}

function transformExportSql(sql, syncPlan) {
  const lines = sql.split(/\r?\n/)
  const transformedLines = []

  for (const line of lines) {
    const transformedLine = transformExportSqlLine(line, syncPlan)
    if (transformedLine !== null) {
      transformedLines.push(transformedLine)
    }
  }

  return `${transformedLines.join('\n')}\n`
}

function transformExportSqlLine(line, syncPlan) {
  const match = line.match(/^INSERT INTO "([^"]+)" VALUES\((.*)\);$/)
  if (!match) {
    return line
  }

  const [, table, rawValues] = match
  if (!syncPlan.exportTables.includes(table)) {
    return null
  }

  if (table === 'SiteParams' && syncPlan.preserveSiteParamKeys.length > 0) {
    const values = splitSqlValues(rawValues)
    const key = parseSqlLiteral(values[1])
    if (syncPlan.preserveSiteParamKeys.includes(key)) {
      return null
    }
  }

  const overrides = syncPlan.columnOverrides[table]
  if (!overrides) {
    return line
  }

  const columns = getInsertColumnOrder(table)
  const values = splitSqlValues(rawValues)
  for (const [columnName, overrideValue] of Object.entries(overrides)) {
    const index = columns.indexOf(columnName)
    if (index === -1) {
      throw new Error(`Cannot override missing column "${columnName}" for table "${table}".`)
    }

    values[index] = toSqlLiteral(overrideValue)
  }

  return `INSERT INTO "${table}" VALUES(${values.join(',')});`
}

function getInsertColumnOrder(table) {
  switch (table) {
    case 'SiteParams':
      return ['id', 'key', 'value', 'createdAt', 'updatedAt']
    case 'Article':
      return ['id', 'title', 'slug', 'excerpt', 'content', 'coverUrl', 'published', 'publishedAt', 'authorId', 'createdAt', 'updatedAt']
    case 'Image':
      return ['id', 'filename', 'url', 'mimeType', 'size', 'width', 'height', 'uploadedById', 'createdAt']
    default:
      throw new Error(`Unsupported export column order for table "${table}".`)
  }
}

function splitSqlValues(rawValues) {
  const values = []
  let current = ''
  let inString = false
  let i = 0

  while (i < rawValues.length) {
    const char = rawValues[i]
    const nextChar = rawValues[i + 1]

    if (char === "'") {
      current += char
      if (inString && nextChar === "'") {
        current += nextChar
        i += 2
        continue
      }

      inString = !inString
      i += 1
      continue
    }

    if (char === ',' && !inString) {
      values.push(current)
      current = ''
      i += 1
      continue
    }

    current += char
    i += 1
  }

  values.push(current)
  return values
}

function parseSqlLiteral(rawValue) {
  if (rawValue === 'NULL') {
    return null
  }

  if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
    return rawValue.slice(1, -1).replaceAll("''", "'")
  }

  return rawValue
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
