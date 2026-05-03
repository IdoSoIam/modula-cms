import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  debug: false,
  features: {
    inlineStyles: true
  },
  nitro: {
    preset: 'cloudflare-pages'
  },
  devServer: {
    https: {
      cert: './certificates/cert.crt',
      key: './certificates/cert.key'
    }
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },
  modules: [
    '@nuxt/image',
    "@nuxt/icon",
    '@nuxtjs/i18n',
    '@pinia/nuxt'
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  css: [
    '@/assets/css/tailwind.css',
    '@/assets/css/main.css',
  ],
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
  },

  runtimeConfig: {
    public: {
      facebookAppId: process.env.FACEBOOK_APP_ID,
      facebookPageId: process.env.FACEBOOK_PAGE_ID
    }
  }
})
