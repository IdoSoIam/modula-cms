import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const localePath = useLocalePath()
  const config = useRuntimeConfig()
  const inDevelopment = config.public.inDevelopment === 'true'
  const normalizedPath = to.path.replace(/^\/en(?=\/|$)/, '') || '/'

  try {
    await authStore.ensureInitialized()
  } catch (error) {
    console.debug('Auth check failed:', error)
  }

  const adminRoutes = ['/admin', '/facebook-test']
  const protectedRoutes = ['/profile', '/commandes']
  const publicAllowedInDevelopment = ['/login', '/construction']

  if (
    inDevelopment &&
    !authStore.isAuthenticated &&
    !publicAllowedInDevelopment.includes(normalizedPath)
  ) {
    return navigateTo(localePath('/construction'))
  }

  if (adminRoutes.some(route => normalizedPath.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo(localePath('/login'))
    }

    if (!authStore.isAdmin) {
      return navigateTo(localePath('/'))
    }
  }

  if (protectedRoutes.some(route => normalizedPath.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      return navigateTo(localePath('/login'))
    }
  }

  if (normalizedPath === '/login' && authStore.isAuthenticated) {
    return navigateTo(localePath('/profile'))
  }

  if (normalizedPath === '/construction' && authStore.isAuthenticated) {
    return navigateTo(localePath('/profile'))
  }
})
