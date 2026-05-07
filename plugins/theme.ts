import { AVAILABLE_THEMES, type ThemeValue } from '~/composables/useTheme'

export default defineNuxtPlugin(() => {
  const { setTheme } = useTheme()

  // Sync reactive state with saved theme (DOM attribute already set by inline script in app.vue)
  if (import.meta.client) {
    const saved = localStorage.getItem('theme') as ThemeValue | null
    if (saved && AVAILABLE_THEMES.some(t => t.value === saved)) {
      setTheme(saved)
    } else {
      setTheme('recolte')
    }
  }
})
