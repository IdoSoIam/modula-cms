import { setCloudflareRuntimeEnv } from '#modula/server/platform/runtime'

export default defineEventHandler((event) => {
  const runtimeEnv = event.context.cloudflare?.env
  if (runtimeEnv) {
    setCloudflareRuntimeEnv(runtimeEnv)
  }
})
