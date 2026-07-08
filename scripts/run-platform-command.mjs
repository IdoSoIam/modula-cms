import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const [platformMode, commandName] = process.argv.slice(2)

if (!platformMode || !commandName) {
  console.error('Usage: node ./scripts/run-platform-command.mjs <cloudflare|server> <dev|build|preview|deploy|start>')
  process.exit(1)
}

if (!['cloudflare', 'server'].includes(platformMode)) {
  console.error(`Unsupported platform mode: ${platformMode}`)
  process.exit(1)
}

const env = {
  ...process.env,
  CMS_RUNTIME_TARGET: platformMode,
  CMS_DB_DRIVER: platformMode === 'cloudflare' ? 'd1' : 'sqlite',
  CMS_STORAGE_DRIVER: platformMode === 'cloudflare' ? 'r2' : 'fs'
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined)
        return
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code ?? 1}`))
    })

    child.on('error', reject)
  })
}

function assertCloudflareBuildArtifacts() {
  const outputDir = path.resolve(process.cwd(), '.output')
  const requiredPathCandidates = [
    [path.join(outputDir, 'wrangler.json')],
    [path.join(outputDir, 'server', 'wrangler.json')]
  ]
  const runtimeCandidates = [
    path.join(outputDir, '_worker.js'),
    path.join(outputDir, 'server', 'index.mjs')
  ]

  if (!fs.existsSync(outputDir)) {
    throw new Error('Cloudflare build incomplete: .output is missing.')
  }

  const hasWranglerManifest = requiredPathCandidates.some((candidates) =>
    candidates.every((candidate) => fs.existsSync(candidate))
  )

  if (!hasWranglerManifest) {
    throw new Error(
      `Cloudflare build incomplete: missing artifact ${path.relative(process.cwd(), path.join(outputDir, 'server', 'wrangler.json'))}`
    )
  }

  if (!runtimeCandidates.some((candidate) => fs.existsSync(candidate))) {
    throw new Error('Cloudflare build incomplete: no worker runtime artifact found in .output.')
  }
}

async function main() {
  switch (commandName) {
    case 'dev':
      await run('npx', ['nuxt', 'dev'])
      break
    case 'build':
      await run('npx', ['nuxt', 'build'])
      break
    case 'preview':
      if (platformMode !== 'cloudflare') {
        throw new Error('preview is only supported for the cloudflare mode')
      }
      await run('npx', ['nuxt', 'build'])
      assertCloudflareBuildArtifacts()
      await run('wrangler', ['--cwd', '.output', 'dev', '--local'])
      break
    case 'deploy':
      if (platformMode !== 'cloudflare') {
        throw new Error('deploy is only supported for the cloudflare mode')
      }
      await run('npx', ['nuxt', 'build'])
      assertCloudflareBuildArtifacts()
      await run('wrangler', ['--cwd', '.output', 'deploy'])
      break
    case 'start':
      if (platformMode !== 'server') {
        throw new Error('start is only supported for the server mode')
      }
      await run('node', ['.output/server/index.mjs'])
      break
    default:
      throw new Error(`Unsupported command: ${commandName}`)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
