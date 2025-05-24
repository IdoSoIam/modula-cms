declare module 'fb' {
  export interface FacebookApiOptions {
    appId?: string
    appSecret?: string
    version?: string
    timeout?: number
  }

  export interface ApiResponse {
    data?: any[]
    paging?: {
      cursors: {
        before: string
        after: string
      }
      next?: string
    }
    error?: {
      message: string
      type: string
      code: number
      error_subcode?: number
      fbtrace_id: string
    }
  }

  export class FB {
    static options(options: FacebookApiOptions): void
    static api(path: string, options?: any): Promise<ApiResponse>
    static getAccessToken(): string | null
    static setAccessToken(token: string): void
  }

  export class FacebookApiException extends Error {
    constructor(res: ApiResponse)
    readonly response: ApiResponse
  }

  export default FB
}
