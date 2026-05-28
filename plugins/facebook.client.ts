import type { FacebookInitParams } from '#modula/types/facebook-sdk'
import { hasCookieConsentForCategory, useCookieConsentCookie } from '#modula/composables/useCookieConsent'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const consentCookie = useCookieConsentCookie()

  const hasThirdPartyConsent = () => hasCookieConsentForCategory(consentCookie.value, 'third_party')

  // Fetch site config to check if Facebook is deactivated
  let facebookDeactivated = false
  try {
    const siteConfig = await ensureSiteConfigState()
    facebookDeactivated = siteConfig?.facebookFluxDeactivated === true
  } catch (e) {
    console.log('[Facebook Plugin] Failed to fetch site config, assuming enabled')
  }

  if (facebookDeactivated) {
    //console.log('[Facebook Plugin] Facebook is deactivated, skipping SDK load')
    return
  }

  if (!hasThirdPartyConsent()) {
    const onConsentUpdate = () => {
      if (!hasThirdPartyConsent()) return
      window.removeEventListener('cookie-consent:updated', onConsentUpdate)
      if (process.client) {
        loadFacebookSDK()
      }
    }

    if (process.client) {
      window.addEventListener('cookie-consent:updated', onConsentUpdate)
    }
    return
  }

  // Load Facebook SDK
  const loadFacebookSDK = (): Promise<void> => {
    return new Promise((resolve) => {
      // Si le SDK est déjà chargé et initialisé, on résout immédiatement
      if (window.FB?.getLoginStatus) {
        console.log('[Facebook Plugin] SDK déjà initialisé')
        window.dispatchEvent(new CustomEvent('facebook:initialized'))
        resolve()
        return
      }

      // Définir fbAsyncInit AVANT de charger le script
      // Le SDK Facebook appelle cette fonction automatiquement après chargement
      window.fbAsyncInit = function () {
        console.log('[Facebook Plugin] fbAsyncInit appelé, initialisation...')

        const appId = config.public.facebookAppId as string
        if (!appId || appId.length < 10) {
          console.error('[Facebook Plugin] APP_ID invalide:', appId)
        }

        const initParams: FacebookInitParams = {
          appId: appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        }

        if (!window.FB) {
          console.error('[Facebook Plugin] window.FB non disponible!')
          return
        }

        window.FB.init(initParams)
        console.log('[Facebook Plugin] FB.init() appelé avec appId:', appId?.substring(0, 10) + '...')

        // Attendre un peu que le SDK soit vraiment prêt
        setTimeout(() => {
          if (window.FB?.getLoginStatus) {
            console.log('[Facebook Plugin] SDK prêt après init')
            window.dispatchEvent(new CustomEvent('facebook:initialized'))
            resolve()
          } else {
            console.error('[Facebook Plugin] SDK non prêt après init!')
          }
        }, 100)
      }

      // Vérifier si le script est déjà présent
      const existingScript = document.querySelector('script[src*="connect.facebook.net"]')
      if (existingScript) {
        console.log('[Facebook Plugin] Script déjà présent, vérification...')

        // Si FB est déjà initialisé, on résout
        if (window.FB?.getLoginStatus) {
          console.log('[Facebook Plugin] FB déjà initialisé (script existant)')
          window.dispatchEvent(new CustomEvent('facebook:initialized'))
          resolve()
          return
        }

        // Le script existe mais FB n'est pas initialisé (hot reload)
        // fbAsyncInit a peut-être déjà été appelé, on essaie d'initialiser manuellement
        console.log('[Facebook Plugin] Script existant mais FB non initialisé, tentative manuelle...')
        setTimeout(() => {
          if (window.FB && !window.FB.getLoginStatus) {
            // FB existe mais pas initialisé, on appelle init manuellement
            const appId = config.public.facebookAppId as string
            const initParams: FacebookInitParams = {
              appId: appId,
              cookie: true,
              xfbml: true,
              version: 'v18.0'
            }
            window.FB.init(initParams)
            console.log('[Facebook Plugin] FB.init() manuel appelé')

            // Attendre que l'init soit effective
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('facebook:initialized'))
              resolve()
            }, 100)
          } else if (window.FB?.getLoginStatus) {
            // FB a été initialisé entre-temps
            window.dispatchEvent(new CustomEvent('facebook:initialized'))
            resolve()
          }
        }, 500)
        return
      }

      console.log('[Facebook Plugin] Chargement du SDK...')
      const script = document.createElement('script')
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.src = 'https://connect.facebook.net/fr_FR/sdk.js'
      document.head.appendChild(script)
    })
  }

  // Load SDK when in browser
  if (process.client) {
    loadFacebookSDK()
  }
})
