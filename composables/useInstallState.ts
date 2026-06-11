interface CmsInstallState {
  installed: boolean
  firstUserCreated: boolean
  databaseReady: boolean
  generatedConfigExists: boolean
  runtimeCompatible: boolean
  runtimeIssue: string | null
  currentRuntimeTarget: 'cloudflare' | 'server'
  detectedRuntimeTarget: 'cloudflare' | 'server'
  configuredRuntimeTarget: 'cloudflare' | 'server'
  currentDbDriver: 'd1' | 'sqlite' | 'mysql' | 'postgres'
  currentStorageDriver: 'fs' | 'r2' | 's3'
  canBootstrapCurrentRuntime: boolean
  cloudflareConfigDetected: boolean
  canSelectCloudflareDrivers: boolean
  siteTemplates?: Array<{
    key: string
    label: { fr: string; en: string }
    description: { fr: string; en: string }
    icon: string
    previewImage?: string
    highlights?: Array<{ fr: string; en: string }>
    themeNames?: string[]
  }>
}

interface InstallNuxtApp {
  _installStatePromise?: Promise<CmsInstallState> | null
}

export function useInstallState() {
  if (!tryUseNuxtApp()) {
    return ref<CmsInstallState | null>(null)
  }
  return useState<CmsInstallState | null>('cms-install-state', () => null)
}

export async function ensureInstallState(): Promise<CmsInstallState | null> {
  const installState = useInstallState()
  if (installState.value) {
    return installState.value
  }

  const nuxtApp = tryUseNuxtApp() as InstallNuxtApp | undefined
  if (!nuxtApp) {
    return null
  }

  if (nuxtApp._installStatePromise) {
    return await nuxtApp._installStatePromise
  }

  const headers = process.server ? useRequestHeaders(['cookie']) : undefined
  nuxtApp._installStatePromise = $fetch<CmsInstallState>('/api/install/status', { headers })

  try {
    const response = await nuxtApp._installStatePromise
    installState.value = response
    return response
  } finally {
    nuxtApp._installStatePromise = null
  }
}
