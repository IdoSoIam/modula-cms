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
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()

  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    if (!sql.trim()) {
      continue
    }

    db.exec(sql)
  }

  console.log(databasePath)
} finally {
  db.close()
}
