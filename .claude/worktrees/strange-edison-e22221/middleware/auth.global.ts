import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Try to fetch user data if not already loaded and not currently loading
  if (!authStore.user && !authStore.isLoading) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      // Silently handle auth check errors
      console.debug('Auth check failed:', error)
    }
  }

  // Routes protégées qui nécessitent d'être admin
  const adminRoutes = ['/admin', '/facebook-test']
  const protectedRoutes = ['/profile', '/commandes']

  // Si c'est une route admin
  if (adminRoutes.some(route => to.path.startsWith(route))) {
    // Si l'utilisateur n'est pas authentifié
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
    // Si l'utilisateur est authentifié mais n'est pas admin
    if (!authStore.isAdmin) {
      return navigateTo('/')
    }
  }

  // Si c'est une route protégée (nécessite authentification)
  if (protectedRoutes.some(route => to.path.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
  }

  // Si l'utilisateur est déjà connecté et essaie d'accéder à login
  if (to.path === '/login' && authStore.isAuthenticated) {
    return navigateTo('/')
  }
});
