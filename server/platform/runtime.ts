interface CloudflareRuntimeEnv {
  DB?: D1Database
  UPLOADS_BUCKET?: R2Bucket
  IMAGE_RESIZER?: any
}

export function getCloudflareRuntimeEnv(): CloudflareRuntimeEnv | undefined {
  return (globalThis as { __env__?: CloudflareRuntimeEnv }).__env__
}

export function setCloudflareRuntimeEnv(env?: CloudflareRuntimeEnv) {
  if (env) {
    ;(globalThis as { __env__?: CloudflareRuntimeEnv }).__env__ = env
    return
  }

  delete (globalThis as { __env__?: CloudflareRuntimeEnv }).__env__
}

export function isCloudflareRuntime() {
  return Boolean(getCloudflareRuntimeEnv())
}
