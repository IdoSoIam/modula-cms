function isLocaleSegment(value: string | null | undefined) {
  return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(String(value || "").trim())
}

function normalizePath(value: string | null | undefined) {
  const source = String(value || '/').trim()
  if (!source || source === '/') return '/'
  return `/${source.replace(/^\/+|\/+$/g, '')}`
}

function normalizeLocales(locales: string[] | null | undefined) {
  return Array.isArray(locales)
    ? locales.map(locale => String(locale || '').trim().toLowerCase()).filter(Boolean)
    : []
}

function stripLocalePrefix(path: string, availableLocales: string[]) {
  const normalizedPath = normalizePath(path)
  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length === 0) return '/'
  const firstSegment = String(segments[0] || '').trim().toLowerCase()
  if (!isLocaleSegment(firstSegment)) return normalizedPath
  if (!availableLocales.includes(firstSegment)) return normalizedPath
  const [, ...rest] = segments
  return rest.length > 0 ? `/${rest.join('/')}` : '/'
}

const PUBLIC_ROUTE_EXCLUSIONS = [
  '/admin',
  '/install',
]

export default defineNuxtRouteMiddleware(async (to) => {
  if (PUBLIC_ROUTE_EXCLUSIONS.some(prefix => to.path === prefix || to.path.startsWith(`${prefix}/`))) {
    return
  }

  const siteConfig = await ensureSiteConfigState({ path: to.path })
  const configuredLocales = normalizeLocales(siteConfig?.siteLocales)
  const defaultLocale = String(siteConfig?.project?.defaultLocale || configuredLocales[0] || 'fr').trim().toLowerCase()
  const availableLocales = configuredLocales.includes(defaultLocale)
    ? configuredLocales
    : [...configuredLocales, defaultLocale].filter(Boolean)

  const firstSegment = to.path.split('/').filter(Boolean)[0] ?? ''
  const normalizedFirstSegment = String(firstSegment).trim().toLowerCase()

  if (availableLocales.includes(normalizedFirstSegment) && normalizedFirstSegment !== defaultLocale) {
    return
  }

  if (normalizedFirstSegment === defaultLocale) {
    return navigateTo({
      path: stripLocalePrefix(to.path, availableLocales),
      query: to.query,
      hash: to.hash,
    }, {
      redirectCode: 301,
    })
  }

  return
})
