const LOCALE_STORAGE_KEY = 'preferred-locale'
const VALID_LOCALES = ['fr', 'en'] as const

type SupportedLocale = (typeof VALID_LOCALES)[number]

const normalizeLocale = (value: string | null | undefined): SupportedLocale | null => {
  if (!value) return null
  const shortLocale = value.toLowerCase().split('-')[0]
  return VALID_LOCALES.includes(shortLocale as SupportedLocale) ? (shortLocale as SupportedLocale) : null
}

type I18nPluginApi = {
  locale: { value: string }
  setLocale: (locale: string) => Promise<void> | void
}

export default defineNuxtPlugin(async (nuxtApp) => {
  const i18n = nuxtApp.$i18n as I18nPluginApi
  const locale = i18n.locale
  const localeCookie = useCookie<string | null>('i18n_redirected', {
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  })
  const browserLocale = useBrowserLocale()

  const storedLocale = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
  const cookieLocale = normalizeLocale(localeCookie.value)
  const detectedLocale = normalizeLocale(typeof browserLocale === 'string' ? browserLocale : null)
  const preferredLocale = storedLocale ?? cookieLocale ?? detectedLocale

  if (preferredLocale && preferredLocale !== locale.value) {
    await i18n.setLocale(preferredLocale)
  }

  const syncLocalePreference = (value: string) => {
    const normalized = normalizeLocale(value)
    if (!normalized) return
    localeCookie.value = normalized
    localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
  }

  syncLocalePreference(locale.value)

  watch(() => locale.value, (value) => {
    syncLocalePreference(value)
  })
})
