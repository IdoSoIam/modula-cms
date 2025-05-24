import type { FacebookInitParams } from '~/types/facebook-sdk'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Load Facebook SDK
  const loadFacebookSDK = (): Promise<void> => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.async = true
      script.defer = true
      script.crossOrigin = 'anonymous'
      script.src = 'https://connect.facebook.net/fr_FR/sdk.js'
      script.onload = () => {
        window.fbAsyncInit = function() {
          const initParams: FacebookInitParams = {
            appId: config.public.facebookAppId as string,
            cookie: true,
            xfbml: true,
            version: 'v17.0'
          }
          window.FB?.init(initParams)
          resolve()
        }
      }
      
      document.head.appendChild(script)
    })
  }

  // Load SDK when in browser
  if (process.client) {
    loadFacebookSDK()
  }
})
