import type { ThemeValue } from '#modula/composables/useTheme'

export default defineNuxtPlugin(() => {
  const { setTheme, availableThemes, defaultTheme } = useTheme()

  // Sync reactive state with saved theme (DOM attribute already set by inline script in app.vue)
  if (import.meta.client) {
    const domTheme = document.documentElement.getAttribute('data-theme')
    const saved = localStorage.getItem('theme') as ThemeValue | null
    if (saved && availableThemes.value.some(t => t.name === saved)) {
      setTheme(saved)
    } else if (domTheme && availableThemes.value.some(t => t.name === domTheme)) {
      setTheme(domTheme)
    } else {
      setTheme(defaultTheme.value)
    }
  }
})
