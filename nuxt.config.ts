// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxt/image', "@nuxt/icon", '@nuxtjs/i18n'],
  css: [
    '@/assets/css/tailwind.css',
    '@/assets/css/overrides.css'  // <-- fichier override en dernier
  ],
  tailwindcss: {
    viewer: false,
    exposeConfig: true,
  },
  i18n: {
  strategy: 'prefix_except_default',
  defaultLocale: 'fr',
  detectBrowserLanguage: {
    useCookie: true,
    cookieKey: 'i18n_redirected',
    redirectOn: 'root',
    fallbackLocale: 'fr'
  },
  vueI18n: './i18n.config.ts',
  locales: [
    {
      code: 'fr',
      iso: 'fr-FR',
      name: 'Français',
      file: 'fr.json'
    },
    {
      code: 'en',
      iso: 'en-US',
      name: 'English',
      file: 'en.json'
    }
  ],
  langDir: 'locales',
}
})