import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { triggerUpdateAgentRollback } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const runtimeConfig = useRuntimeConfig(event)
  const runtimeTarget = String(runtimeConfig.public?.cmsRuntimeTarget || runtimeConfig.cmsRuntimeTarget || 'server')
  if (process.env.NODE_ENV !== 'production' || runtimeTarget === 'cloudflare') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Updates disabled for this runtime',
      message: 'Les mises à jour intégrées sont désactivées en développement et en runtime Cloudflare. Revenez sur votre dépôt puis appliquez les migrations manuellement si nécessaire.'
    })
  }
  const body = await readBody<{ mode?: 'fast' | 'full' }>(event).catch(() => null)
  const mode = body?.mode === 'full' ? 'full' : 'fast'
  return await triggerUpdateAgentRollback(mode)
})
