import { AVAILABLE_THEMES, type ThemeValue } from '~/composables/useTheme'

export default defineNuxtPlugin((nuxtApp) => {
  const { applyTheme } = useTheme()

  nuxtApp.hook('app:created', () => {
    if (!import.meta.client) return
    const saved = localStorage.getItem('theme') as ThemeValue | null
    if (saved && AVAILABLE_THEMES.some(t => t.value === saved)) {
      applyTheme(saved)
    } else {
      applyTheme('ferme')
    }
  })
})
