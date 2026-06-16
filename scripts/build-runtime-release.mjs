import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'

const cwd = process.cwd()
const pkg = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'))
const version = process.argv[2] || pkg.version || '0.0.0'
const distDir = path.join(cwd, 'dist-releases')
const archivePath = path.join(distDir, `modula-cms-runtime-${version}.tar.gz`)
const manifestPath = path.join(cwd, '.release-manifest.json')
const distManifestPath = path.join(distDir, `modula-cms-runtime-${version}.manifest.json`)
const updateScriptPath = path.join('scripts', 'update-agent.mjs')

await mkdir(distDir, { recursive: true })

await rm(path.join(cwd, '.output'), { recursive: true, force: true })
await run('node ./scripts/run-platform-command.mjs server build')

const releaseManifest = {
  version,
  builtAt: new Date().toISOString(),
  packageName: pkg.name,
  includesUpdateScript: existsSync(path.join(cwd, updateScriptPath)),
  migrations: await buildMigrationManifest(),
  rollbackPolicy: {
    fast: 'code-only-if-schema-compatible',
    full: 'code-and-database-restore',
    fullRestoreWarning: 'A complete rollback restores the database backup created before the update and discards any data added afterwards.'
  }
}

await writeFile(manifestPath, JSON.stringify(releaseManifest, null, 2), 'utf8')
await writeFile(distManifestPath, JSON.stringify(releaseManifest, null, 2), 'utf8')

try {
  const entries = ['.output', '.release-manifest.json', 'migrations']
  if (existsSync(path.join(cwd, updateScriptPath))) {
    entries.push(updateScriptPath)
  }
  await run(`tar -czf "${archivePath}" ${entries.join(' ')}`)
} finally {
  await rm(manifestPath, { force: true })
}
console.log(archivePath)

function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { cwd, shell: true, stdio: 'inherit' })
    child.on('exit', (code) => code === 0 ? resolve(undefined) : reject(new Error(`Command failed: ${command}`)))
    child.on('error', reject)
  })
}

async function buildMigrationManifest() {
  const migrationsDir = path.join(cwd, 'migrations')
  if (!existsSync(migrationsDir)) return []

  const entries = (await readdir(migrationsDir))
    .filter(file => file.endsWith('.sql'))
    .sort()

  const manifest = []
  for (const file of entries) {
    const contents = await readFile(path.join(migrationsDir, file), 'utf8')
    manifest.push({
      name: file,
      checksum: createHash('sha256').update(contents).digest('hex')
    })
  }

  return manifest
}
