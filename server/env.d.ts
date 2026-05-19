declare module 'h3' {
  interface H3EventContext {
    cloudflare: {
      request: Request
      env: {
        DB: D1Database
        UPLOADS_BUCKET: R2Bucket
        IMAGE_RESIZER: any
      }
      context: ExecutionContext
    }
  }
}

export {}
