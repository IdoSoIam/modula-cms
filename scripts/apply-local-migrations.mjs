import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const shouldReset = process.argv.includes('--reset')
const projectRoot = process.cwd()
const migrationsDir = path.join(projectRoot, 'migrations')
const databasePath = path.join(projectRoot, 'prisma', 'local.db')

if (!fs.existsSync(migrationsDir)) {
  throw new Error(`Migration directory not found: ${migrationsDir}`)
}

if (shouldReset && fs.existsSync(databasePath)) {
  fs.rmSync(databasePath, { force: true })
}

fs.mkdirSync(path.dirname(databasePath), { recursive: true })

const db = new Database(databasePath)

try {
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE IF NOT EXISTS "_local_migrations" (
      "name" TEXT NOT NULL PRIMARY KEY,
      "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  const appliedRows = db.prepare('SELECT name FROM "_local_migrations"').all()
  const appliedNames = new Set(appliedRows.map((row) => row.name))

  const tableExists = (tableName) => {
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(tableName)
    return Boolean(row)
  }

  const columnExists = (tableName, columnName) => {
    if (!tableExists(tableName)) return false
    const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all()
    return columns.some((column) => column.name === columnName)
  }

  const inferAlreadyApplied = (file) => {
    switch (file) {
      case '0001_init.sql':
        return tableExists('SiteParams')
      case '0002_drop_image_data.sql':
        return tableExists('Image') && !columnExists('Image', 'data')
      case '0003_add_cms_foundations.sql':
        return tableExists('CmsPage') && tableExists('CmsNavigationItem')
      default:
        return false
    }
  }

  for (const file of migrationFiles) {
    if (appliedNames.has(file)) {
      continue
    }

    if (inferAlreadyApplied(file)) {
      db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
      continue
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    if (!sql.trim()) {
      db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
      continue
    }

    db.exec(sql)
    db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
  }

  console.log(databasePath)
} finally {
  db.close()
}
