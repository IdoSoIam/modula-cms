import { useAuthStore } from '#modula/stores/auth'

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

  await authStore.ensureInitialized()

  if (!authStore.isAuthenticated) {
    const siteConfig = await ensureSiteConfigState({ path: to.path }).catch(() => null)
    const configuredLocales = normalizeLocales(siteConfig?.siteLocales)
    const defaultLocale = normalizeLocaleCode(siteConfig?.project?.defaultLocale) || configuredLocales[0] || 'fr'
    const availableLocales = configuredLocales.includes(defaultLocale)
      ? configuredLocales
      : [...configuredLocales, defaultLocale].filter(Boolean)
    const firstSegment = normalizePath(to.path).split('/').filter(Boolean)[0] ?? ''
    const requestedLocale = isLocaleSegment(firstSegment) && availableLocales.includes(normalizeLocaleCode(firstSegment))
      ? normalizeLocaleCode(firstSegment)
      : defaultLocale

    return navigateTo(buildPublicPath('/login', requestedLocale, defaultLocale, availableLocales))
  }
})
