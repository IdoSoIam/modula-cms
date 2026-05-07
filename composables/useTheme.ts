export const AVAILABLE_THEMES = [
  { value: 'recolte',    label: 'Récolte',          preview: '#fbf1e0' },
  { value: 'ferme',      label: 'Champ ensoleillé', preview: '#fbf6ec' },
  { value: 'ferme-dark', label: "Nuit à l'étable",  preview: '#221c14' }
] as const

export type ThemeValue = typeof AVAILABLE_THEMES[number]['value']

const DEFAULT_THEME: ThemeValue = 'recolte'
const STORAGE_KEY = 'theme'

export const useTheme = () => {
  const theme = useState<ThemeValue>('theme', () => DEFAULT_THEME)

  const setTheme = (value: ThemeValue) => {
    theme.value = value
    if (!import.meta.client) return
    document.documentElement.setAttribute('data-theme', value)
    if (value === DEFAULT_THEME) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, value)
    }
  }

  const toggleLightDark = () => {
    setTheme(theme.value === 'ferme-dark' ? 'ferme' : 'ferme-dark')
  }

  return {
    theme,
    availableThemes: AVAILABLE_THEMES,
    setTheme,
    toggleLightDark
  }
}
