export const AVAILABLE_THEMES = [
  { value: 'ferme', label: 'Champ ensoleillé' },
  { value: 'ferme-dark', label: 'Nuit à l\'étable' },
  { value: 'prairie', label: 'Prairie' },
  { value: 'recolte', label: 'Récolte' },
  { value: 'lavande', label: 'Lavande' }
] as const

export type ThemeValue = typeof AVAILABLE_THEMES[number]['value']

const DEFAULT_THEME: ThemeValue = 'ferme'
const STORAGE_KEY = 'theme'

export const useTheme = () => {
  const theme = useState<ThemeValue>('theme', () => DEFAULT_THEME)

  const applyTheme = (value: ThemeValue) => {
    theme.value = value
    if (import.meta.client) {
      document.documentElement.setAttribute('data-theme', value)
      if (value === DEFAULT_THEME) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, value)
      }
    }
  }

  const toggleTheme = () => {
    applyTheme(theme.value === 'ferme-dark' ? 'ferme' : 'ferme-dark')
  }

  return {
    theme,
    themes: AVAILABLE_THEMES,
    applyTheme,
    toggleTheme
  }
}
