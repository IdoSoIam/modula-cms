declare module 'h3' {
  interface H3EventContext {
    cloudflare: {
      request: Request
      env: {
        DB: D1Database
        IMAGES: R2Bucket
      }
      context: ExecutionContext
    }
  }
}

export {}
