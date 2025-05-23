export default defineNuxtPlugin((nuxtApp) => {
  const { theme } = useTheme()
  
  nuxtApp.hook('app:created', () => {
    if (import.meta.client) {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme) {
        theme.value = savedTheme
        document.documentElement.setAttribute('data-theme', savedTheme)
      }
    }
  })
})