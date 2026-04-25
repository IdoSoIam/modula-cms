export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  
  // Initialize auth state on app startup
  if (process.client) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // Silently handle initial auth check errors
      console.debug('Initial auth check failed:', error)
    }
  }
})
