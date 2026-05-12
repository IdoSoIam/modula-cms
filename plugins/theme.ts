import type { ThemeValue } from '~/composables/useTheme'

export default defineNuxtPlugin(() => {
  const { setTheme, availableThemes, defaultTheme } = useTheme()

  // Sync reactive state with saved theme (DOM attribute already set by inline script in app.vue)
  if (import.meta.client) {
    const saved = localStorage.getItem('theme') as ThemeValue | null
    if (saved && availableThemes.value.some(t => t.name === saved)) {
      setTheme(saved)
    } else {
      setTheme(defaultTheme.value)
    }
  }
})
