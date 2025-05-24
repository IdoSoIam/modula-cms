import type { FacebookLoginStatus } from './facebook'

interface FacebookInitParams {
  appId: string | undefined
  cookie: boolean
  xfbml: boolean
  version: string
}

interface FacebookLoginParams {
  scope: string
}

interface FacebookSDKBase {
  init(params: FacebookInitParams): void
  login(callback: (response: FacebookLoginStatus) => void, params: FacebookLoginParams): void
  getLoginStatus(callback: (response: FacebookLoginStatus) => void): void
  api(path: string, params?: Record<string, any>): Promise<any>
  logout(callback: (response: FacebookLoginStatus) => void): void
  options(options: {
    appId?: string
    appSecret?: string
    version?: string
  }): void
}

declare global {
  interface Window {
    FB: FacebookSDKBase | undefined
    fbAsyncInit: () => void
  }
}

export type { FacebookSDKBase as FacebookSDK, FacebookInitParams, FacebookLoginStatus, FacebookLoginParams }
