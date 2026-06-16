import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { triggerUpdateAgentRollback } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (process.env.NODE_ENV !== 'production') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Updates disabled for development',
      message: 'Les mises à jour intégrées sont désactivées en développement.'
    })
  }
  const body = await readBody<{ mode?: 'fast' | 'full' }>(event).catch(() => null)
  const mode = body?.mode === 'full' ? 'full' : 'fast'
  return await triggerUpdateAgentRollback(mode)
})
