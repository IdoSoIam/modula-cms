import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()
  const localePath = useLocalePath()
  const normalizedPath = to.path.replace(/^\/en(?=\/|$)/, '') || '/'
  const adminRoutes = ['/admin', '/facebook-test']
  const protectedRoutes = ['/profile', '/commandes']
  const authAwareRoutes = ['/login', '/construction']
  const needsAuthState = hasAuthSessionCookie()
    || adminRoutes.some(route => normalizedPath.startsWith(route))
    || protectedRoutes.some(route => normalizedPath.startsWith(route))
    || authAwareRoutes.includes(normalizedPath)

  if (needsAuthState) {
    try {
      await authStore.ensureInitialized()
    } catch (error) {
      console.debug('Auth check failed:', error)
    }
  }

  let inDevelopment = false
  let constructionPath = '/construction'
  try {
    // Skip site config check if no Nuxt app context (edge case during SSR)
    if (tryUseNuxtApp()) {
      const siteConfig = await ensureSiteConfigState()
      inDevelopment = siteConfig?.inDevelopment === true
      constructionPath = siteConfig?.constructionPagePath || '/construction'
    }
  } catch (error) {
    console.debug('Site config check failed:', error)
  }

  const publicAllowedInDevelopment = ['/login', '/construction', constructionPath]

  if (
    inDevelopment &&
    !authStore.isAuthenticated &&
    !publicAllowedInDevelopment.includes(normalizedPath)
  ) {
    return navigateTo(localePath(constructionPath))
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

  if ((normalizedPath === '/construction' || normalizedPath === constructionPath) && authStore.isAuthenticated) {
    return navigateTo(localePath('/profile'))
  }
})
