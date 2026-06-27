import { useAuthStore } from '#modula/stores/auth'
import { ensureInstallState } from '#modula/composables/useInstallState'

function normalizeLocaleCode(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

function normalizePath(value: string | null | undefined) {
  const source = String(value || '/').trim()
  if (!source || source === '/') return '/'
  return `/${source.replace(/^\/+|\/+$/g, '')}`
}

function normalizeLocales(locales: string[] | null | undefined) {
  return Array.isArray(locales)
    ? locales.map(locale => normalizeLocaleCode(locale)).filter(Boolean)
    : []
}

function isLocaleSegment(value: string | null | undefined) {
  return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(String(value || '').trim())
}

function stripLocalePrefix(path: string, availableLocales: string[]) {
  const normalizedPath = normalizePath(path)
  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 0) return '/'
  const firstSegment = normalizeLocaleCode(segments[0])
  if (!firstSegment || !isLocaleSegment(firstSegment)) return normalizedPath
  if (!availableLocales.includes(firstSegment)) return normalizedPath
  const [, ...rest] = segments
  return rest.length > 0 ? `/${rest.join('/')}` : '/'
}

function extractRequestedLocale(path: string, defaultLocale: string, availableLocales: string[]) {
  const firstSegment = normalizePath(path).split('/').filter(Boolean)[0] ?? ''
  const normalized = normalizeLocaleCode(firstSegment)
  if (!normalized || !isLocaleSegment(normalized)) return defaultLocale
  if (!availableLocales.includes(normalized)) return defaultLocale
  return normalized
}

function buildPublicPath(path: string, locale: string, defaultLocale: string, availableLocales: string[]) {
  const normalizedLocale = normalizeLocaleCode(locale) || defaultLocale
  const normalizedPath = stripLocalePrefix(path, availableLocales)
  if (normalizedLocale === defaultLocale) {
    return normalizedPath
  }
  if (normalizedPath === '/') {
    return `/${normalizedLocale}`
  }
  return `/${normalizedLocale}${normalizedPath}`
}

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const adminLocalePath = useLocalePath()
  const normalizedPath = to.path.replace(/^\/[a-z]{2}(?:-[a-z]{2})?(?=\/|$)/i, '') || '/'
  const installAllowedRoutes = ['/install', '/password-setup']
  const adminRoutes = ['/admin']
  const protectedRoutes = ['/profile', '/commandes']
  const authAwareRoutes = ['/login', '/construction', '/install']
  let defaultPublicLocale = 'fr'
  let requestedPublicLocale = 'fr'
  let availablePublicLocales = ['fr', 'en']

  const resolvePublicPath = (path: string) => buildPublicPath(path, requestedPublicLocale, defaultPublicLocale, availablePublicLocales)
  const needsAuthState = hasAuthSessionCookie()
    || adminRoutes.some(route => normalizedPath.startsWith(route))
    || protectedRoutes.some(route => normalizedPath.startsWith(route))
    || authAwareRoutes.includes(normalizedPath)

  if (needsAuthState) {
    try {
      await authStore.ensureInitialized()
    } catch (error) {
      console.debug('Auth check failed:', error)
    }
  }

  try {
    if (tryUseNuxtApp()) {
      const installState = await ensureInstallState()
      const requiresInitialInstall = installState && !installState.installed
      if (requiresInitialInstall) {
        const isAllowed = installAllowedRoutes.some(route => normalizedPath === route || normalizedPath.startsWith(`${route}/`))
        if (!isAllowed) {
          return navigateTo(adminLocalePath('/install'))
        }
      } else if (installState?.installed && normalizedPath === '/install') {
        return navigateTo(authStore.isAuthenticated ? adminLocalePath('/admin') : resolvePublicPath('/login'))
      }
    }
  } catch (error) {
    console.debug('Install check failed:', error)
  }

  let inDevelopment = false
  let constructionPath = '/construction'
  try {
    // Skip site config check if no Nuxt app context (edge case during SSR)
    if (tryUseNuxtApp()) {
      const siteConfig = await ensureSiteConfigState()
      inDevelopment = siteConfig?.inDevelopment === true
      constructionPath = siteConfig?.constructionPagePath || '/construction'
      const configuredLocales = normalizeLocales(siteConfig?.siteLocales)
      defaultPublicLocale = normalizeLocaleCode(siteConfig?.project?.defaultLocale) || configuredLocales[0] || 'fr'
      availablePublicLocales = configuredLocales.includes(defaultPublicLocale)
        ? configuredLocales
        : [...configuredLocales, defaultPublicLocale].filter(Boolean)
      requestedPublicLocale = extractRequestedLocale(to.path, defaultPublicLocale, availablePublicLocales)
    }
  } catch (error) {
    console.debug('Site config check failed:', error)
  }

  const publicAllowedInDevelopment = ['/login', '/construction', constructionPath, '/password-setup']

  if (
    inDevelopment &&
    !authStore.isAuthenticated &&
    !publicAllowedInDevelopment.some(route => normalizedPath === route || normalizedPath.startsWith(`${route}/`))
  ) {
    return navigateTo(resolvePublicPath(constructionPath))
  }

  if (adminRoutes.some(route => normalizedPath.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo(resolvePublicPath('/login'))
    }

    if (!authStore.canAccessAdmin) {
      return navigateTo(resolvePublicPath('/'))
    }
  }

  if (protectedRoutes.some(route => normalizedPath.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo(resolvePublicPath('/login'))
    }
  }

  if (normalizedPath === '/login' && authStore.isAuthenticated) {
    return navigateTo(resolvePublicPath('/profile'))
  }

  if ((normalizedPath === '/construction' || normalizedPath === constructionPath) && authStore.isAuthenticated) {
    return navigateTo(resolvePublicPath('/profile'))
  }
})
