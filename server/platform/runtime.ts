interface RuntimeD1Statement {
  bind(...bindings: unknown[]): RuntimeD1Statement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<{ results?: T[] | null }>
  run(): Promise<{ meta?: { changes?: number; last_row_id?: number | string | null; lastRowId?: number | string | null } | null }>
}

interface RuntimeD1Database {
  prepare(sql: string): RuntimeD1Statement
}

interface RuntimeR2ObjectBody {
  body: ReadableStream | Uint8Array | ArrayBuffer | null
  size: number
  uploaded?: Date
  arrayBuffer(): Promise<ArrayBuffer>
  text(): Promise<string>
  httpMetadata?: { contentType?: string }
}

interface RuntimeR2ListResult {
  objects: Array<{ key: string; size: number; uploaded: Date }>
  truncated?: boolean
  cursor?: string
}

interface RuntimeR2Bucket {
  put(key: string, value: BodyInit | ArrayBuffer | ArrayBufferView, options?: unknown): Promise<void>
  get(key: string): Promise<(RuntimeR2ObjectBody & { httpMetadata?: { contentType?: string } }) | null>
  head(key: string): Promise<{ httpMetadata?: { contentType?: string } } | null>
  list(options?: { cursor?: string }): Promise<RuntimeR2ListResult>
  delete(key: string): Promise<void>
}

interface CloudflareRuntimeEnv {
  DB?: RuntimeD1Database
  UPLOADS_BUCKET?: RuntimeR2Bucket
  IMAGE_RESIZER?: unknown
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
