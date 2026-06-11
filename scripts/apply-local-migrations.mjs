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
      case '0004_add_cms_page_specialrole.sql':
        return tableExists('CmsPage') && columnExists('CmsPage', 'specialRole')
      case '0005_add_image_variants_and_usages.sql':
        return tableExists('ImageVariant') && tableExists('ImageUsage')
      case '0006_add_roles_and_events.sql':
        return tableExists('Role') && tableExists('Event') && tableExists('RolePermission')
      case '0007_add_member_roles_and_event_audience_split.sql':
        return tableExists('MemberRole') && tableExists('UserMemberRole') && tableExists('EventAudienceMemberRole')
      case '0008_add_event_recurrence_and_occurrences.sql':
        return tableExists('EventOccurrence') && columnExists('Event', 'recurrenceType')
      case '0009_add_password_setup_tokens.sql':
        return tableExists('PasswordSetupToken')
      case '0010_add_cms_update_jobs.sql':
        return tableExists('cms_update_jobs') && tableExists('cms_update_job_logs')
      default:
        return false
    }
  }

  const getMigrationAliases = (file) => {
    switch (file) {
      case '0007_add_member_roles_and_event_audience_split.sql':
        return ['007_add_member_roles_and_event_audience_split.sql']
      case '0008_add_event_recurrence_and_occurrences.sql':
        return ['008_add_event_recurrence_and_occurrences.sql']
      case '0009_add_password_setup_tokens.sql':
        return ['009_add_password_setup_tokens.sql']
      case '0010_add_cms_update_jobs.sql':
        return ['010_add_cms_update_jobs.sql']
      default:
        return []
    }
  }

  const reconcileMigrationAliases = () => {
    const pairs = [
      ['007_add_member_roles_and_event_audience_split.sql', '0007_add_member_roles_and_event_audience_split.sql'],
      ['008_add_event_recurrence_and_occurrences.sql', '0008_add_event_recurrence_and_occurrences.sql'],
      ['009_add_password_setup_tokens.sql', '0009_add_password_setup_tokens.sql'],
      ['010_add_cms_update_jobs.sql', '0010_add_cms_update_jobs.sql']
    ]

    for (const [legacyName, canonicalName] of pairs) {
      const row = db.prepare('SELECT 1 FROM "_local_migrations" WHERE name = ?').get(legacyName)
      if (row) {
        db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(canonicalName)
        db.prepare('DELETE FROM "_local_migrations" WHERE name = ?').run(legacyName)
      }
    }
  }

  reconcileMigrationAliases()

  for (const file of migrationFiles) {
    const aliases = getMigrationAliases(file)
    const matchedAlias = aliases.find((alias) => appliedNames.has(alias))
    if (appliedNames.has(file) || matchedAlias) {
      if (matchedAlias && !appliedNames.has(file)) {
        db.prepare('INSERT OR IGNORE INTO "_local_migrations" ("name") VALUES (?)').run(file)
      }
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
