type RuntimeEnvValue = string | undefined

function readCloudflareEnv(name: string): RuntimeEnvValue {
  const env = (globalThis as { __env__?: Record<string, unknown> }).__env__
  const value = env?.[name]
  return typeof value === 'string' ? value : undefined
}

export function getEnv(name: string): RuntimeEnvValue {
  return readCloudflareEnv(name) ?? process.env[name]
}

export function getRequiredEnv(name: string, errorMessage?: string): string {
  const value = getEnv(name)
  if (!value) {
    throw new Error(errorMessage ?? `Missing required environment variable: ${name}`)
  }
  return value
}
