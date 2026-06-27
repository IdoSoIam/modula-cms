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

const CONTENT_LOCALE_PARAM = ':contentLocale([a-zA-Z]{2}(?:-[a-zA-Z]{2})?)'
const ROUTE_PREFIX_EXCLUSIONS = ['/admin', '/install']

function isExcludedPublicRoute(pathname: string) {
  return ROUTE_PREFIX_EXCLUSIONS.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

function isCatchAllRoute(pathname: string) {
  return pathname.includes('(.*)*')
}

function cloneRouteBranchWithContentLocale(route: any, isRoot = true): any {
  const clonedChildren = Array.isArray(route.children)
    ? route.children.map((child: any) => cloneRouteBranchWithContentLocale(child, false))
    : route.children

  const originalPath = typeof route.path === 'string' && route.path.trim()
    ? route.path.trim()
    : '/'
  const prefixedPath = isRoot
    ? (originalPath === '/' ? `/${CONTENT_LOCALE_PARAM}` : `/${CONTENT_LOCALE_PARAM}${originalPath}`)
    : originalPath

  return {
    ...route,
    name: route.name ? `${route.name}__contentLocale` : route.name,
    path: prefixedPath,
    children: clonedChildren,
  }
}

function extendRoutesWithContentLocales(routes: any[]) {
  const prefixedRoutes: any[] = []
  const deferredOriginalCatchAllRoutes: any[] = []
  const deferredPrefixedCatchAllRoutes: any[] = []
  const nextRoutes: any[] = []

  for (const route of routes) {
    const pathname = typeof route.path === 'string' && route.path.trim()
      ? route.path.trim()
      : '/'

    const excluded = pathname.startsWith(`/${CONTENT_LOCALE_PARAM}`) || isExcludedPublicRoute(pathname)
    if (!excluded) {
      const clonedRoute = cloneRouteBranchWithContentLocale(route, true)
      if (isCatchAllRoute(pathname)) {
        deferredPrefixedCatchAllRoutes.push(clonedRoute)
      } else {
        prefixedRoutes.push(clonedRoute)
      }
    }

    if (isCatchAllRoute(pathname)) {
      deferredOriginalCatchAllRoutes.push(route)
    } else {
      nextRoutes.push(route)
    }
  }

  routes.splice(
    0,
    routes.length,
    ...nextRoutes,
    ...prefixedRoutes,
    ...deferredPrefixedCatchAllRoutes,
    ...deferredOriginalCatchAllRoutes,
  )
}

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
  hooks: {
    'pages:extend'(routes) {
      extendRoutesWithContentLocales(routes)
    }
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
  }


})
