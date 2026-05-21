import { buildPublicDaisyUiThemeConfig, createDefaultDaisyUiThemeConfig } from '~/shared/themes'

export type ThemeValue = string

const STORAGE_KEY = 'theme'
const FALLBACK_PUBLIC_THEME_CONFIG = buildPublicDaisyUiThemeConfig(createDefaultDaisyUiThemeConfig())
export const AVAILABLE_THEMES = FALLBACK_PUBLIC_THEME_CONFIG.themeSelectorThemes.map((theme) => ({
  label: theme.displayName,
  value: theme.name
}))

function getFallbackPublicThemeConfig() {
  return FALLBACK_PUBLIC_THEME_CONFIG
}

export const useTheme = () => {
  const siteConfig = useSiteConfigState()
  const fallbackConfig = getFallbackPublicThemeConfig()
  const publicThemeConfig = computed(() => siteConfig.value?.themes ?? fallbackConfig)
  const defaultTheme = computed(() => publicThemeConfig.value.defaultTheme)
  const defaultDarkTheme = computed(() =>
    publicThemeConfig.value.allThemeNames.find((name) => name.includes('dark')) || defaultTheme.value
  )
  const theme = useState<ThemeValue>('theme', () => defaultTheme.value)

  const setTheme = (value: ThemeValue) => {
    const allowedThemes = publicThemeConfig.value.allThemeNames
    const nextTheme = allowedThemes.includes(value) ? value : defaultTheme.value
    theme.value = nextTheme
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-theme', nextTheme)
    if (nextTheme === defaultTheme.value) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, nextTheme)
    }
  }

  watch(defaultTheme, (value) => {
    if (!theme.value || !publicThemeConfig.value.allThemeNames.includes(theme.value)) {
      theme.value = value
    }
  }, { immediate: true })

  const toggleLightDark = () => {
    setTheme(theme.value === defaultDarkTheme.value ? defaultTheme.value : defaultDarkTheme.value)
  }

  return {
    theme,
    availableThemes: computed(() => publicThemeConfig.value.themeSelectorThemes),
    themeControllerEnabled: computed(() => publicThemeConfig.value.enableThemeController),
    defaultTheme,
    defaultDarkTheme,
    setTheme,
    toggleLightDark
  }
}
