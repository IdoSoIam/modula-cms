export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()
  const localePath = useLocalePath()

  await authStore.ensureInitialized()

  if (!authStore.isAuthenticated) {
    return navigateTo(localePath('/login'))
  }
})
