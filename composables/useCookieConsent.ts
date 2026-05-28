import type { CmsCookieServiceCategory } from '#modula/shared/cms'

const CONSENT_COOKIE = 'cms_cookie_consent'

interface CookieConsentValue {
  acceptedCategories: CmsCookieServiceCategory[]
  savedAt: string
}

export function parseCookieConsent(raw: string | null | undefined): CookieConsentValue | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CookieConsentValue>
    const acceptedCategories = Array.isArray(parsed.acceptedCategories)
      ? parsed.acceptedCategories.filter((value): value is CmsCookieServiceCategory =>
          value === 'essential' || value === 'preferences' || value === 'third_party' || value === 'marketing'
        )
      : []
    return {
      acceptedCategories,
      savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString()
    }
  } catch {
    return null
  }
}

export function serializeCookieConsent(value: CookieConsentValue) {
  return JSON.stringify(value)
}

export function hasCookieConsentForCategory(raw: string | null | undefined, category: CmsCookieServiceCategory) {
  if (category === 'essential') return true
  const parsed = parseCookieConsent(raw)
  return Boolean(parsed?.acceptedCategories.includes(category))
}

export function useCookieConsentCookie() {
  return useCookie<string | null>(CONSENT_COOKIE, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  })
}
