import { getSetting, setSetting, SETTING_KEYS } from '~/server/utils/settings'
import type { DaisyUiThemeConfig, PublicDaisyUiThemeConfig } from '~/shared/themes'
import { buildPublicDaisyUiThemeConfig, createDefaultDaisyUiThemeConfig, normalizeDaisyUiThemeConfig } from '~/shared/themes'

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

export async function getDaisyUiThemeConfig(): Promise<DaisyUiThemeConfig> {
  const raw = await getSetting(SETTING_KEYS.DAISYUI_THEME_CONFIG)
  const parsed = parseJson<DaisyUiThemeConfig>(raw)
  return normalizeDaisyUiThemeConfig(parsed ?? createDefaultDaisyUiThemeConfig())
}

export async function saveDaisyUiThemeConfig(config: DaisyUiThemeConfig) {
  const normalized = normalizeDaisyUiThemeConfig(config)
  await setSetting(SETTING_KEYS.DAISYUI_THEME_CONFIG, JSON.stringify(normalized))
}

export function validateDaisyUiThemeConfigPayload(value: unknown) {
  return normalizeDaisyUiThemeConfig(value)
}

export async function getPublicDaisyUiThemeConfig(): Promise<PublicDaisyUiThemeConfig> {
  return buildPublicDaisyUiThemeConfig(await getDaisyUiThemeConfig())
}
