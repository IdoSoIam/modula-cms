import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { buildRuntimeMigrationManifest } from './runtime-migrations.mjs'

const cwd = process.cwd()
const pkg = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'))
const version = process.argv[2] || pkg.version || '0.0.0'
if (pkg.version !== version) {
  pkg.version = version
  await writeFile(path.join(cwd, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
}
const distDir = path.join(cwd, 'dist-releases')
const archivePath = path.join(distDir, `modula-cms-runtime-${version}.tar.gz`)
const manifestPath = path.join(cwd, '.release-manifest.json')
const distManifestPath = path.join(distDir, `modula-cms-runtime-${version}.manifest.json`)
const updateScriptPath = path.join('scripts', 'update-agent.mjs')
const migrationHelperPath = path.join('scripts', 'runtime-migrations.mjs')

await mkdir(distDir, { recursive: true })

await rm(path.join(cwd, '.output'), { recursive: true, force: true })
await run('node ./scripts/run-platform-command.mjs server build')

const releaseManifest = {
  version,
  builtAt: new Date().toISOString(),
  packageName: pkg.name,
  includesUpdateScript: existsSync(path.join(cwd, updateScriptPath)),
  migrations: await buildRuntimeMigrationManifest(path.join(cwd, 'migrations')),
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
  if (existsSync(path.join(cwd, migrationHelperPath))) {
    entries.push(migrationHelperPath)
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
