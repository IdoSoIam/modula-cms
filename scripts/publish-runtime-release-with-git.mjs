import { spawn } from 'node:child_process'
import path from 'node:path'

const cwd = process.cwd()
const version = process.argv[2]

if (!version) {
  console.error('Usage: npm run release:publish:git -- <version>')
  process.exit(1)
}

const currentBranch = (await runCapture('git branch --show-current')).trim()
if (!currentBranch) {
  console.error('Unable to determine current git branch.')
  process.exit(1)
}

const worktreeStatus = (await runCapture('git status --short')).trim()
if (worktreeStatus) {
  console.error('Git worktree must be clean before running release:publish:git.')
  console.error('Commit or stash your changes first.')
  process.exit(1)
}

const mainBranch = 'main'
const releaseMessage = `release: ${version}`

await run('git fetch origin')

if (currentBranch !== mainBranch) {
  await run(`git checkout ${mainBranch}`)
}

try {
  await run(`git pull --ff-only origin ${mainBranch}`)

  if (currentBranch !== mainBranch) {
    await run(`git merge --no-ff ${currentBranch} -m "${releaseMessage}"`)
  } else {
    await run(`git commit --allow-empty -m "${releaseMessage}"`)
  }

  await run(`git push origin ${mainBranch}`)
  await run(`node "${path.join(cwd, 'scripts', 'publish-runtime-release.mjs')}" ${version}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

function run(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: 'inherit'
    })
    child.on('exit', code => code === 0 ? resolve(undefined) : reject(new Error(`Command failed: ${command}`)))
    child.on('error', reject)
  })
}

function runCapture(command) {
  return new Promise((resolve, reject) => {
    let stdout = ''
    let stderr = ''
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    child.stdout.on('data', chunk => {
      stdout += String(chunk)
    })
    child.stderr.on('data', chunk => {
      stderr += String(chunk)
    })
    child.on('exit', code => code === 0 ? resolve(stdout) : reject(new Error(stderr || `Command failed: ${command}`)))
    child.on('error', reject)
  })
}
