export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  await authStore.ensureInitialized()

  if (!authStore.isAuthenticated) {
    return navigateTo('/login')
  }
})
