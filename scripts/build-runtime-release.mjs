import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

const cwd = process.cwd()
const pkg = JSON.parse(await readFile(path.join(cwd, 'package.json'), 'utf8'))
const version = process.argv[2] || pkg.version || '0.0.0'
const distDir = path.join(cwd, 'dist-releases')
const archivePath = path.join(distDir, `modula-cms-runtime-${version}.tar.gz`)
const manifestPath = path.join(cwd, '.release-manifest.json')
const agentDir = path.resolve(cwd, '..', 'modula-agent')

await mkdir(distDir, { recursive: true })

await run('npx nuxt build')

await writeFile(manifestPath, JSON.stringify({
  version,
  builtAt: new Date().toISOString(),
  packageName: pkg.name,
  includesAgent: existsSync(path.join(agentDir, 'package.json'))
}, null, 2), 'utf8')

try {
  const entries = ['.output', '.env.example', '.release-manifest.json']
  if (existsSync(path.join(agentDir, 'package.json'))) {
    entries.push(`-C "${path.dirname(agentDir)}" "${path.basename(agentDir)}"`)
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
