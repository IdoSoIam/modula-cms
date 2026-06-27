import { createI18n } from 'vue-i18n'
import en from '#modula/i18n/locales/en.json'
import fr from '#modula/i18n/locales/fr.json'

type AdminLocale = 'fr' | 'en'

const VALID_ADMIN_LOCALES: AdminLocale[] = ['fr', 'en']
const LOCALE_STORAGE_KEY = 'preferred-locale'

function normalizeAdminLocale(value: string | null | undefined): AdminLocale {
  const normalized = String(value || '').trim().toLowerCase().split('-')[0]
  return VALID_ADMIN_LOCALES.includes(normalized as AdminLocale) ? normalized as AdminLocale : 'fr'
}

export default defineNuxtPlugin((nuxtApp) => {
  const vueApp = nuxtApp.vueApp as typeof nuxtApp.vueApp & { __modulaI18nInstalled?: boolean }
  if (vueApp.__modulaI18nInstalled) {
    return
  }

  const localeCookie = useCookie<string>('i18n_redirected', {
    default: () => 'fr',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })

  const i18n = createI18n({
    legacy: false,
    locale: normalizeAdminLocale(localeCookie.value),
    fallbackLocale: 'fr',
    messages: {
      fr,
      en,
    },
  })

  vueApp.use(i18n)
  vueApp.__modulaI18nInstalled = true

  if (import.meta.client) {
    const browserLocale = typeof navigator !== 'undefined' ? navigator.language : null
    const storedLocale = normalizeAdminLocale(localStorage.getItem(LOCALE_STORAGE_KEY))
    const cookieLocale = normalizeAdminLocale(localeCookie.value)
    const detectedLocale = normalizeAdminLocale(browserLocale)
    const preferredLocale = storedLocale || cookieLocale || detectedLocale

    if (preferredLocale && preferredLocale !== i18n.global.locale.value) {
      i18n.global.locale.value = preferredLocale
    }

    watch(
      () => i18n.global.locale.value,
      (value) => {
        const normalized = normalizeAdminLocale(value)
        localeCookie.value = normalized
        localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
      },
      { immediate: true },
    )
  }
})
