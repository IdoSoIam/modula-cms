import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  try {
    await authStore.ensureInitialized()
  } catch (error) {
    console.debug('Auth check failed:', error)
  }

  const adminRoutes = ['/admin', '/facebook-test']
  const protectedRoutes = ['/profile', '/commandes']

  if (adminRoutes.some(route => to.path.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }

    if (!authStore.isAdmin) {
      return navigateTo('/')
    }
  }

  if (protectedRoutes.some(route => to.path.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    return navigateTo('/profile')
  }
})
