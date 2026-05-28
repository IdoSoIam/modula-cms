const initCwd = process.env.INIT_CWD
const currentCwd = process.cwd()

if (initCwd && initCwd !== currentCwd) {
  const { spawnSync } = await import('node:child_process')
  const { fileURLToPath } = await import('node:url')
  const initScriptPath = fileURLToPath(new URL('./init-host-project.mjs', import.meta.url))
  const result = spawnSync(process.execPath, [initScriptPath], {
    cwd: initCwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  console.log('[modula-cms] host project initialized in dependency mode.')
  process.exit(0)
}

const { spawnSync } = await import('node:child_process')

for (const command of [
  ['npx', ['nuxt', 'prepare']],
  ['npx', ['prisma', 'generate']]
]) {
  const [bin, args] = command
  const result = spawnSync(bin, args, {
    cwd: currentCwd,
    stdio: 'inherit',
    shell: true
  })

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
