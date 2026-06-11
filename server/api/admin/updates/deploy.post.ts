import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { triggerUpdateAgentDeployment } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ version?: string }>(event)
  if (!body?.version?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Target version required' })
  }
  return await triggerUpdateAgentDeployment(body.version.trim())
})
