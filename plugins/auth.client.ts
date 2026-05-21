export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()

  if (!process.client || !hasAuthSessionCookie()) return

  try {
    await authStore.fetchUser()
  } catch (error) {
    console.debug('Initial auth check failed:', error)
  }
})
