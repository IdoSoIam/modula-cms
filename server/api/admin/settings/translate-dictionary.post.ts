import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getSiteDefaultLocale, getSiteLocales, SETTING_KEYS } from '#modula/server/utils/settings'
import { getAdminPublicDictionary, savePublicDictionary } from '#modula/server/utils/publicDictionary'
import { translateRegistryTexts } from '#modula/server/utils/cmsRegistry'
import type { CmsLocalizedText } from '#modula/shared/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{ key?: string }>(event)
  const dictionaryKey = String(body?.key || '').trim()
  if (!dictionaryKey) {
    throw createError({ statusCode: 400, statusMessage: 'Dictionary key required' })
  }

  const [siteLocales, siteDefaultLocale] = await Promise.all([
    getSiteLocales(),
    getSiteDefaultLocale()
  ])

  const defaultLocale = siteDefaultLocale || siteLocales[0] || 'fr'
  const dictionary = await getAdminPublicDictionary(siteLocales)
  const entry = dictionary.find((item) => item.key === dictionaryKey)
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Dictionary entry not found' })
  }

  const sourceText = entry.values[defaultLocale]?.trim()
  if (!sourceText) {
    throw createError({ statusCode: 400, statusMessage: 'Default locale text required before translation' })
  }

  const targetLocales = siteLocales.filter((locale) => locale !== defaultLocale && !entry.values[locale]?.trim())
  if (!targetLocales.length) {
    return {
      translated: 0,
      cached: 0,
      totalTasks: 0,
      entry
    }
  }

  const response = await translateRegistryTexts(
    targetLocales.map((targetLocale) => ({
      text: sourceText,
      sourceLocale: defaultLocale,
      targetLocale
    }))
  )

  const nextValues: CmsLocalizedText = { ...(entry.values || {}) }
  let translated = 0
  let cached = 0

  for (const item of response.items) {
    if (!item.translatedText?.trim()) continue
    nextValues[item.targetLocale] = item.translatedText
    if (item.cached) cached += 1
    else translated += 1
  }

  const current = Object.fromEntries(
    dictionary.map((item) => [item.key, { ...(item.values || {}) }])
  ) as Record<string, CmsLocalizedText>

  current[dictionaryKey] = nextValues
  await savePublicDictionary(current)

  return {
    translated,
    cached,
    totalTasks: targetLocales.length,
    entry: {
      ...entry,
      values: nextValues,
      settingKey: SETTING_KEYS.PUBLIC_LOCALE_DICTIONARY
    }
  }
})
