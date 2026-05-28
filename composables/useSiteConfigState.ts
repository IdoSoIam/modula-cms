import type { PublicSiteShell } from '#modula/shared/cms'
import type { PublicDaisyUiThemeConfig } from '#modula/shared/themes'

interface PublicSiteConfigState {
  project?: {
    key: string
    displayName: string
    defaultLocale: 'fr' | 'en'
  }
  installRequired?: boolean
  facebookFluxDeactivated: boolean
  inDevelopment: boolean
  siteName: string
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  featureFlags?: {
    inDevelopment: boolean
    registerEnabled: boolean
    subscriptionsEnabled: boolean
    shop: {
      enabled: boolean
      basketsEnabled: boolean
      vegetablesEnabled: boolean
    }
    associationRolesEnabled: boolean
    eventsEnabled: boolean
    newsEnabled: boolean
  }
  ordersWindow?: {
    from: string | null
    to: string | null
    message: string
    isOpen: boolean
  }
  farmPickup?: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  }
  contactEmail?: string | null
  adminEmail?: string | null
  adminPhone?: string | null
  cms?: PublicSiteShell | null
  themes?: PublicDaisyUiThemeConfig | null
  constructionPagePath?: string | null
}

interface SiteConfigNuxtApp {
  _siteConfigPromise?: Promise<PublicSiteConfigState> | null
}

export function useSiteConfigState() {
  // Guard: useState requires Nuxt context
  if (!tryUseNuxtApp()) {
    return ref<PublicSiteConfigState | null>(null)
  }
  return useState<PublicSiteConfigState | null>('site-config', () => null)
}

export async function ensureSiteConfigState(): Promise<PublicSiteConfigState | null> {
  const siteConfig = useSiteConfigState()
  if (siteConfig.value) {
    return siteConfig.value
  }

  const nuxtApp = tryUseNuxtApp() as SiteConfigNuxtApp | undefined
  if (!nuxtApp) {
    // Gracefully return null if no Nuxt context (SSR edge case)
    return null
  }
  if (nuxtApp._siteConfigPromise) {
    return await nuxtApp._siteConfigPromise
  }

  const headers = process.server ? useRequestHeaders(['cookie']) : undefined
  const url = '/api/site-config' as const
  nuxtApp._siteConfigPromise = $fetch<PublicSiteConfigState>(url, { headers })

  try {
    const response = await nuxtApp._siteConfigPromise
    siteConfig.value = response
    return response
  } finally {
    nuxtApp._siteConfigPromise = null
  }
}

export async function useSiteConfig() {
  await ensureSiteConfigState()
  return useSiteConfigState()
}
