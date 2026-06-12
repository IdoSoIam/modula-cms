import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { triggerUpdateAgentDeployment } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const runtimeConfig = useRuntimeConfig(event)
  const runtimeTarget = String(runtimeConfig.public?.cmsRuntimeTarget || runtimeConfig.cmsRuntimeTarget || 'server')
  if (process.env.NODE_ENV !== 'production' || runtimeTarget === 'cloudflare') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Updates disabled for this runtime',
      message: 'Les mises à jour intégrées sont désactivées en développement et en runtime Cloudflare. Mettez le code à jour manuellement puis appliquez les migrations.'
    })
  }
  const body = await readBody<{ version?: string }>(event)
  if (!body?.version?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Target version required' })
  }
  return await triggerUpdateAgentDeployment(body.version.trim())
})
