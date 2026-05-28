import { fileURLToPath } from 'node:url'
import path from 'node:path'
import type { NuxtConfig } from 'nuxt/config'
import type { CmsProjectConfig } from '../shared/platform'

const layerRoot = fileURLToPath(new URL('..', import.meta.url))

/** Map ~/ imports used by modula-cms server code to the layer root. */
function buildLayerNitroAliases(): Record<string, string> {
  return {
    '~/server': path.resolve(layerRoot, 'server'),
    '~/shared': path.resolve(layerRoot, 'shared'),
    '~/prisma': path.resolve(layerRoot, 'prisma'),
    '~/types': path.resolve(layerRoot, 'types'),
    '~/cms': path.resolve(layerRoot, 'cms'),
    '~/cms.project.config': path.resolve(layerRoot, 'cms.project.config'),
  }
}

export function createModulaCmsHostConfig(projectConfig: CmsProjectConfig, overrides: NuxtConfig = {}): NuxtConfig {
  process.env.CMS_PROJECT_CONFIG_JSON = JSON.stringify(projectConfig)
  process.env.CMS_RUNTIME_TARGET ??= projectConfig.platform.runtimeTarget
  process.env.CMS_DB_DRIVER ??= projectConfig.platform.dbDriver
  process.env.CMS_STORAGE_DRIVER ??= projectConfig.platform.storageDriver
  process.env.CMS_FILESYSTEM_STORAGE_DIR ??= projectConfig.storage.filesystemDir
  process.env.CMS_PUBLIC_UPLOADS_PATH ??= projectConfig.storage.publicUploadsPath

  const baseExtends = Array.isArray(overrides.extends)
    ? overrides.extends
    : overrides.extends
      ? [overrides.extends]
      : []
  const allowDevtools = process.env.CMS_ALLOW_SLOW_DEVTOOLS === '1'
  const overrideDevtools = (overrides.devtools && typeof overrides.devtools === 'object') ? overrides.devtools as Record<string, any> : {}
  const overrideVite = (overrides.vite && typeof overrides.vite === 'object') ? overrides.vite as Record<string, any> : {}
  const overrideViteServer = (overrideVite.server && typeof overrideVite.server === 'object') ? overrideVite.server as Record<string, any> : {}
  const overrideViteWatch = (overrideViteServer.watch && typeof overrideViteServer.watch === 'object') ? overrideViteServer.watch as Record<string, any> : {}
  const overrideViteWarmup = (overrideViteServer.warmup && typeof overrideViteServer.warmup === 'object') ? overrideViteServer.warmup as Record<string, any> : {}
  const existingWarmupClientFiles = Array.isArray(overrideViteWarmup.clientFiles) ? [...overrideViteWarmup.clientFiles] : []
  const mergedWarmupClientFiles = Array.from(new Set([
    ...existingWarmupClientFiles,
    'node_modules/modula-cms/assets/css/tailwind.css',
    'node_modules/modula-cms/assets/css/main.css'
  ]))
  const existingIgnored = Array.isArray(overrideViteWatch.ignored)
    ? [...overrideViteWatch.ignored]
    : (typeof overrideViteWatch.ignored === 'string' ? [overrideViteWatch.ignored] : [])
  const normalizedIgnored = Array.from(new Set([
    ...existingIgnored,
    '**/node_modules/modula-cms/**',
    '**/.wrangler/**',
    '**/.output/**'
  ]))
  const requiredCssEntries = [
    path.resolve(layerRoot, 'assets/css/tailwind.css'),
    path.resolve(layerRoot, 'assets/css/main.css')
  ]
  const overrideCssEntries = Array.isArray(overrides.css) ? overrides.css : []
  const filteredOverrideCssEntries = overrideCssEntries.filter((entry) => {
    if (typeof entry !== 'string') return true
    return entry !== 'modula-cms/assets/css/tailwind.css'
      && entry !== 'modula-cms/assets/css/main.css'
      && !entry.endsWith('/node_modules/modula-cms/assets/css/tailwind.css')
      && !entry.endsWith('/node_modules/modula-cms/assets/css/main.css')
  })
  const mergedCssEntries = Array.from(new Set([
    ...requiredCssEntries,
    ...filteredOverrideCssEntries
  ]))

  return {
    ...overrides,
    extends: [layerRoot, ...(baseExtends as any[])],
    alias: {
      ...(typeof overrides.alias === 'object' && overrides.alias ? overrides.alias as Record<string, string> : {}),
      '#modula': layerRoot
    },
    devtools: {
      ...overrideDevtools,
      enabled: allowDevtools ? overrideDevtools.enabled !== false : false
    },
    vite: {
      ...overrideVite,
      server: {
        ...overrideViteServer,
        warmup: {
          ...overrideViteWarmup,
          clientFiles: mergedWarmupClientFiles
        },
        watch: {
          ...overrideViteWatch,
          ignored: normalizedIgnored
        }
      }
    },
    css: mergedCssEntries,
    nitro: {
      ...(overrides.nitro || {}),
      alias: {
        ...buildLayerNitroAliases(),
        ...(typeof overrides.nitro === 'object' && overrides.nitro && 'alias' in overrides.nitro
          ? (overrides.nitro as Record<string, any>).alias
          : {})
      }
    }
  } as NuxtConfig
}
