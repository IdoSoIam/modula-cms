import { setCloudflareRuntimeEnv } from '#modula/server/platform/runtime'

export default defineEventHandler((event) => {
  setCloudflareRuntimeEnv(event.context.cloudflare?.env)
})
