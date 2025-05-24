import type { FacebookLoginStatus } from './facebook'

interface FacebookSDK {
  init(params: {
    appId: string
    cookie?: boolean
    xfbml?: boolean
    version: string
  }): void
  
  login(
    callback: (response: FacebookLoginStatus) => void,
    params?: { scope: string }
  ): void
  
  getLoginStatus(callback: (response: FacebookLoginStatus) => void): void
  
  api<T = any>(
    path: string,
    params?: { [key: string]: any }
  ): Promise<T>
  
  logout(callback: (response: FacebookLoginStatus) => void): void
  
  options(options: {
    appId?: string
    appSecret?: string
    version?: string
  }): void
}

declare global {
  interface Window {
    FB: FacebookSDK | undefined
    fbAsyncInit: () => void
  }
}
