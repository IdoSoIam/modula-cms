import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  debug: false,
  experimental: {
    appManifest: false
  },
  features: {
    inlineStyles: true
  },
  nitro: {
    preset: 'cloudflare_module',
    experimental: {
      wasm: true
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    }
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
    '@pinia/nuxt',
    'nitro-cloudflare-dev'
  ],
  vite: {
    plugins: [
      tailwindcss(),
      {
        apply: 'build',
        name: 'vite-plugin-ignore-sourcemap-warnings',
        configResolved(config) {
          const originalOnWarn = config.build.rollupOptions.onwarn;
          config.build.rollupOptions.onwarn = (warning, warn) => {
            if (
              warning.code === 'SOURCEMAP_BROKEN' &&
              (warning.plugin === '@tailwindcss/vite:generate:build' ||
                warning.plugin === 'nuxt:module-preload-polyfill')
            ) {
              return;
            }

            if (originalOnWarn) {
              originalOnWarn(
                warning, warn
              );
            } else {
              warn(
                warning
              );
            }
          };
        },
      },
    ],
    css: {
      devSourcemap: false
    },
    build: {
      sourcemap: false
    },
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@tanstack/vue-query',
        '@iconify-json/mdi',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-image',
        '@tiptap/extension-link',
      ]
    }
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
      redirectOn: 'all',
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
      inDevelopment: process.env.NUXT_PUBLIC_IN_DEVELOPMENT ?? 'false',
      facebookAppId: process.env.FACEBOOK_APP_ID,
      facebookPageId: process.env.FACEBOOK_PAGE_ID
    }
  }


})
