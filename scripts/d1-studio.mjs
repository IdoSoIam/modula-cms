import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execSync } from 'node:child_process'
import Database from 'better-sqlite3'

const projectRoot = process.cwd()
const databaseName = 'ferme-du-campeyrigoux'
const studioDbPath = path.join(projectRoot, 'prisma', 'd1-local-studio.db')
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ferme-d1-studio-'))
const exportSqlPath = path.join(tempDir, 'd1-local-export.sql')

try {
  execSync(buildCommand([
    'npx',
    'wrangler',
    'd1',
    'export',
    databaseName,
    '--local',
    '--output',
    exportSqlPath,
    '--skip-confirmation'
  ]), {
    cwd: projectRoot,
    stdio: 'inherit'
  })

  fs.mkdirSync(path.dirname(studioDbPath), { recursive: true })
  fs.rmSync(studioDbPath, { force: true })

  const db = new Database(studioDbPath)
  try {
    db.exec('PRAGMA foreign_keys = OFF')
    const sql = fs.readFileSync(exportSqlPath, 'utf8')
    db.exec(sql)
    db.exec('PRAGMA foreign_keys = ON')
  } finally {
    db.close()
  }

  execSync(buildCommand([
    'npx',
    '-p',
    'better-sqlite3',
    '-p',
    'prisma',
    'prisma',
    'studio',
    '--url',
    'file:./prisma/d1-local-studio.db'
  ]), {
    cwd: projectRoot,
    stdio: 'inherit'
  })
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true })
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
