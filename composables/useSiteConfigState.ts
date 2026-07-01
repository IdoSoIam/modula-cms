import type { PublicSiteShell } from '#modula/shared/cms'
import type { PublicDaisyUiThemeConfig } from '#modula/shared/themes'

interface PublicSiteConfigState {
  project?: {
    key: string
    displayName: string
    defaultLocale: string
  }
  installRequired?: boolean
  runtimeCompatible?: boolean
  runtimeIssue?: string | null
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
  siteLocales?: string[]
  siteDefaultLocale?: string
  localeLabels?: Record<string, { short: string; long: string }>
  publicDictionary?: Record<string, string>
  shellLocale?: string
}

interface SiteConfigNuxtApp {
  _siteConfigPromise?: Promise<PublicSiteConfigState> | null
}

interface EnsureSiteConfigStateOptions {
  path?: string | null
  locale?: string | null
}

export function useSiteConfigState() {
  // Guard: useState requires Nuxt context
  if (!tryUseNuxtApp()) {
    return ref<PublicSiteConfigState | null>(null)
  }
  return useState<PublicSiteConfigState | null>('site-config', () => null)
}

export async function ensureSiteConfigState(options: EnsureSiteConfigStateOptions = {}): Promise<PublicSiteConfigState | null> {
  const siteConfig = useSiteConfigState()
  const requestedLocale = resolveRequestedSiteShellLocale(options)
  if (siteConfig.value) {
    if (!siteConfig.value.shellLocale || siteConfig.value.shellLocale === requestedLocale) {
      return siteConfig.value
    }
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
  nuxtApp._siteConfigPromise = $fetch<PublicSiteConfigState>(url, {
    headers,
    query: { locale: requestedLocale }
  })

  try {
    const response = await nuxtApp._siteConfigPromise
    siteConfig.value = {
      ...response,
      shellLocale: requestedLocale
    }
    return response
  } finally {
    nuxtApp._siteConfigPromise = null
  }
}

export async function useSiteConfig() {
  await ensureSiteConfigState()
  return useSiteConfigState()
}

function normalizeLocaleCode(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

function resolveRequestedSiteShellLocale(options: EnsureSiteConfigStateOptions = {}) {
  const explicitLocale = normalizeLocaleCode(options.locale || '')
  if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(explicitLocale)) {
    return explicitLocale
  }

  if (options.path) {
    const firstSegment = String(options.path || '/').split('?')[0]?.split('/').filter(Boolean)[0] ?? ''
    const routeLocale = normalizeLocaleCode(firstSegment)
    if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(routeLocale)) {
      return routeLocale
    }
  }

  if (import.meta.server) {
    const requestPath = useRequestURL().pathname || '/'
    const firstSegment = String(requestPath).split('?')[0]?.split('/').filter(Boolean)[0] ?? ''
    const requestLocale = normalizeLocaleCode(firstSegment)
    if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(requestLocale)) {
      return requestLocale
    }
    return 'fr'
  }

  const localeCookie = useCookie<string>('cms_content_locale', {
    default: () => 'fr',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  })

  const clientPath = typeof window !== 'undefined' ? window.location.pathname || '/' : '/'
  const firstSegment = String(clientPath).split('?')[0]?.split('/').filter(Boolean)[0] ?? ''
  const routeLocale = normalizeLocaleCode(firstSegment)
  if (/^[a-z]{2}(?:-[a-z]{2})?$/.test(routeLocale)) {
    return routeLocale
  }

  return normalizeLocaleCode(localeCookie.value || 'fr') || 'fr'
}
