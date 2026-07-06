import type { CmsLocalizedText } from '#modula/shared/cms'
import {
  getPublicDictionaryDefaultStore,
  getPublicDictionaryDefinitionMap,
  PUBLIC_DICTIONARY_DEFINITIONS,
  type PublicDictionaryStore,
} from '#modula/shared/publicDictionary'

import { getCmsLocaleFallbacks } from '#modula/shared/cms'

import { getSetting, setSetting, SETTING_KEYS } from '#modula/server/utils/settings'

function normalizeLocaleCode(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

function cloneLocalizedText(value?: CmsLocalizedText | null): CmsLocalizedText {
  return Object.fromEntries(
    Object.entries(value || {}).map(([locale, text]) => [normalizeLocaleCode(locale), String(text || '')])
  )
}

export async function getStoredPublicDictionary(): Promise<PublicDictionaryStore> {
  const defaults = getPublicDictionaryDefaultStore()
  const raw = await getSetting(SETTING_KEYS.PUBLIC_LOCALE_DICTIONARY)
  if (!raw) return defaults

  try {
    const parsed = JSON.parse(raw) as Record<string, CmsLocalizedText>
    const definitionMap = getPublicDictionaryDefinitionMap()
    for (const [key, value] of Object.entries(parsed || {})) {
      if (!definitionMap.has(key)) continue
      defaults[key] = {
        ...defaults[key],
        ...cloneLocalizedText(value)
      }
    }
  } catch {}

  return defaults
}

export async function savePublicDictionary(input: Record<string, CmsLocalizedText>) {
  const definitionMap = getPublicDictionaryDefinitionMap()
  const defaults = getPublicDictionaryDefaultStore()
  const output: Record<string, CmsLocalizedText> = {}

  for (const [key, value] of Object.entries(input || {})) {
    if (!definitionMap.has(key)) continue
    output[key] = {
      ...defaults[key],
      ...cloneLocalizedText(value)
    }
  }

  await setSetting(SETTING_KEYS.PUBLIC_LOCALE_DICTIONARY, JSON.stringify(output))
}

export async function getAdminPublicDictionary(locales: string[]) {
  const stored = await getStoredPublicDictionary()

  return PUBLIC_DICTIONARY_DEFINITIONS.map((definition) => ({
    ...definition,
    values: Object.fromEntries(
      locales.map((locale) => {
        const normalizedLocale = normalizeLocaleCode(locale)
        return [normalizedLocale, stored[definition.key]?.[normalizedLocale] ?? '']
      })
    ) as CmsLocalizedText
  }))
}

export async function getResolvedPublicDictionary(
  locale: string,
  availableLocales: string[],
  defaultLocale: string
) {
  const normalizedLocale = normalizeLocaleCode(locale)
  const normalizedDefaultLocale = normalizeLocaleCode(defaultLocale) || 'fr'
  const stored = await getStoredPublicDictionary()
  const resolved: Record<string, string> = {}
  const fallbackLocales = getCmsLocaleFallbacks(normalizedLocale, normalizedDefaultLocale)

  for (const definition of PUBLIC_DICTIONARY_DEFINITIONS) {
    const entry = stored[definition.key] || definition.defaultValue
    resolved[definition.key] = fallbackLocales
      .map(candidate => entry[candidate])
      .find(value => value?.trim())
      || entry.fr
      || entry.en
      || ''
  }

  for (const localeCode of availableLocales) {
    const normalized = normalizeLocaleCode(localeCode)
    if (!normalized) continue
  }

  return resolved
}
