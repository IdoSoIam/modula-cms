async function readJsonFile(filePath: string) {
  const { readFile } = await import('node:fs/promises')
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function resolvePackageVersion(packageName: string) {
  const { existsSync } = await import('node:fs')
  const path = await import('node:path')
  const filePath = path.resolve(process.cwd(), 'node_modules', packageName, 'package.json')
  if (!existsSync(filePath)) return null
  try {
    const pkg = await readJsonFile(filePath) as { version?: string }
    return pkg.version || null
  } catch {
    return null
  }
}

async function resolveNpmVersion() {
  const userAgent = process.env.npm_config_user_agent || ''
  const match = userAgent.match(/npm\/([^\s]+)/i)
  if (match?.[1]) return match[1]
  return null
}

export async function getSystemInfo(runtimeTarget: string) {
  const { existsSync } = await import('node:fs')
  const path = await import('node:path')
  const packageJsonPath = path.resolve(process.cwd(), 'package.json')
  let appVersion: string | null = null
  if (existsSync(packageJsonPath)) {
    try {
      const pkg = await readJsonFile(packageJsonPath) as { version?: string }
      appVersion = pkg.version || null
    } catch {}
  }

  const info = {
    appVersion,
    runtimeTarget,
    nodeVersion: typeof process !== 'undefined' ? process.version : null,
    npmVersion: await resolveNpmVersion(),
    nuxtVersion: await resolvePackageVersion('nuxt'),
    nitroVersion: await resolvePackageVersion('nitropack'),
    platform: null as string | null,
    architecture: null as string | null,
    hostname: null as string | null,
    totalMemoryMb: null as number | null,
    freeMemoryMb: null as number | null,
  }

  try {
    const os = await import('node:os')
    info.platform = `${os.platform()} ${os.release()}`
    info.architecture = os.arch()
    info.hostname = os.hostname()
    info.totalMemoryMb = Math.round(os.totalmem() / 1024 / 1024)
    info.freeMemoryMb = Math.round(os.freemem() / 1024 / 1024)
  } catch {}

  return info
}
