import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { triggerUpdateAgentDeployment } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  if (process.env.NODE_ENV !== 'production') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Updates disabled for development',
      message: 'Les mises à jour intégrées sont désactivées en développement.'
    })
  }
  const body = await readBody<{ version?: string }>(event)
  if (!body?.version?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Target version required' })
  }
  return await triggerUpdateAgentDeployment(body.version.trim())
})
