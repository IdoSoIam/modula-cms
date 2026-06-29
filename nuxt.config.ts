import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import defaultCmsProjectConfig from './cms.project.config'
import { parseCmsProjectConfigJson, resolveCmsPlatformConfig } from './shared/platform'

const layerRoot = fileURLToPath(new URL('.', import.meta.url))
const cmsProjectConfig = parseCmsProjectConfigJson(process.env.CMS_PROJECT_CONFIG_JSON) || defaultCmsProjectConfig
const platformConfig = resolveCmsPlatformConfig(process.env, cmsProjectConfig)
const isCloudflareRuntime = platformConfig.runtimeTarget === 'cloudflare'
const imageDeliveryMode = platformConfig.imageDeliveryMode
const siteURL = platformConfig.siteUrl
const imageCloudflareBaseURL = platformConfig.imageCloudflareBaseURL
const imageSourceBaseURL = platformConfig.imageSourceBaseURL
const imageCloudflareHostname = (() => {
  try {
    return new URL(imageCloudflareBaseURL).host
  } catch {
    return ''
  }
})()
const imageSourceHostname = (() => {
  try {
    return new URL(imageSourceBaseURL).host
  } catch {
    return ''
  }
})()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  debug: false,
  alias: {
    '#modula': layerRoot
  },
  experimental: {
    appManifest: false
  },
  features: {
    inlineStyles: true
  },
  nitro: {
    preset: isCloudflareRuntime ? 'cloudflare_module' : 'node_server',
    experimental: {
      wasm: true
    },
    alias: {
      '~/server': path.resolve(layerRoot, 'server'),
      '~/shared': path.resolve(layerRoot, 'shared'),
      '~/types': path.resolve(layerRoot, 'types'),
      '~/cms': path.resolve(layerRoot, 'cms'),
      '~/cms.project.config': path.resolve(layerRoot, 'cms.project.config'),
      '../shared/': path.resolve(layerRoot, 'shared') + '/',
      '../shared/platform.ts': path.resolve(layerRoot, 'shared/platform.ts')
    },
    ...(isCloudflareRuntime
      ? {
        cloudflare: {
          deployConfig: true,
          nodeCompat: false
        }
      }
      : {}),
    rollupConfig: {}
  },

  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },
  modules: [
    '@nuxt/image',
    ['@nuxt/icon', {
      collections: ['mdi'],
      mode: 'svg',
      fallbackToApi: true,
      clientBundle: {
        scan: false,
      },
    }],
    '@pinia/nuxt',
    ...(isCloudflareRuntime ? ['nitro-cloudflare-dev'] : [])
  ],
  imports: {
    presets: [
      {
        from: 'vue-i18n',
        imports: ['useI18n']
      }
    ]
  },
  vite: {
    resolve: {
      alias: {}
    },
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
        '@iconify-json/mdi',
        '@tiptap/vue-3',
        '@tiptap/starter-kit',
        '@tiptap/extension-image',
        '@tiptap/extension-link',
        'vue-i18n',
      ]
    }
  },
  css: [
    path.resolve(layerRoot, 'assets/css/tailwind.css'),
    path.resolve(layerRoot, 'assets/css/main.css'),
  ],
  image: {
    provider: imageDeliveryMode === 'worker' ? 'cloudflare' : 'ipx',
    quality: 80,
    format: ['webp'],
    densities: [1, 2],
    cloudflare: {
      baseURL: imageCloudflareBaseURL
    }
  },

  runtimeConfig: {
    cmsMigrationsDir: path.resolve(process.cwd(), process.env.CMS_MIGRATIONS_DIR?.trim() || 'migrations'),
    ipx: {
      http: {
        domains: [
          'localhost:3000',
          '127.0.0.1:3000',
          'localhost',
          '127.0.0.1',
          imageCloudflareHostname,
          imageSourceHostname
        ].filter(Boolean).join(',')
      }
    },
    cmsProjectKey: cmsProjectConfig.site.key,
    cmsDbDriver: platformConfig.dbDriver,
    cmsStorageDriver: platformConfig.storageDriver,
    cmsRuntimeTarget: platformConfig.runtimeTarget,
    cmsFilesystemStorageDir: platformConfig.filesystemDir,
    imageStorageDriver: platformConfig.storageDriver === 'fs' ? 'filesystem' : platformConfig.storageDriver,
    imageFilesystemDir: platformConfig.filesystemDir,
    public: {
      inDevelopment: process.env.NUXT_PUBLIC_IN_DEVELOPMENT ?? 'false',
      cmsProjectKey: cmsProjectConfig.site.key,
      cmsDbDriver: platformConfig.dbDriver,
      cmsStorageDriver: platformConfig.storageDriver,
      cmsRuntimeTarget: platformConfig.runtimeTarget,
      cmsPublicUploadsPath: platformConfig.publicUploadsPath,
      imageStorageDriver: platformConfig.storageDriver === 'fs' ? 'filesystem' : platformConfig.storageDriver,
      imageDeliveryMode,
      imageCloudflareBaseURL,
      imageSourceBaseURL,
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() || ''
    }
  },
  hooks: {
    'pages:extend'(pages) {
      const localePrefix = '/:contentLocale([a-zA-Z-]{2,10})'
      const prefixedRoutes = [
        { name: 'public-locale-home', path: `${localePrefix}`, file: path.resolve(layerRoot, 'pages/index.vue') },
        { name: 'public-locale-login', path: `${localePrefix}/login`, file: path.resolve(layerRoot, 'pages/login.vue') },
        { name: 'public-locale-register', path: `${localePrefix}/register`, file: path.resolve(layerRoot, 'pages/register.vue') },
        { name: 'public-locale-profile', path: `${localePrefix}/profile`, file: path.resolve(layerRoot, 'pages/profile.vue') },
        { name: 'public-locale-cart', path: `${localePrefix}/panier`, file: path.resolve(layerRoot, 'pages/panier.vue') },
        { name: 'public-locale-cookies', path: `${localePrefix}/cookies`, file: path.resolve(layerRoot, 'pages/cookies.vue') },
        { name: 'public-locale-payment-success', path: `${localePrefix}/payment/success`, file: path.resolve(layerRoot, 'pages/payment/success.vue') },
        { name: 'public-locale-payment-cancel', path: `${localePrefix}/payment/cancel`, file: path.resolve(layerRoot, 'pages/payment/cancel.vue') },
        { name: 'public-locale-password-setup', path: `${localePrefix}/password-setup/:token`, file: path.resolve(layerRoot, 'pages/password-setup/[token].vue') },
        { name: 'public-locale-order-manage', path: `${localePrefix}/orders/manage/:token`, file: path.resolve(layerRoot, 'pages/orders/manage/[token].vue') },
        { name: 'public-locale-product-detail', path: `${localePrefix}/products/:slug`, file: path.resolve(layerRoot, 'pages/products/[slug].vue') },
        { name: 'public-locale-event-detail', path: `${localePrefix}/events/:slug`, file: path.resolve(layerRoot, 'pages/events/[slug].vue') },
        { name: 'public-locale-news-detail', path: `${localePrefix}/news/:slug`, file: path.resolve(layerRoot, 'pages/news/[slug].vue') },
        { name: 'public-locale-cms-catchall', path: `${localePrefix}/:slug(.*)*`, file: path.resolve(layerRoot, 'pages/[...slug].vue') },
      ]

      for (const route of prefixedRoutes) {
        pages.push(route as any)
      }
    }
  }


})
