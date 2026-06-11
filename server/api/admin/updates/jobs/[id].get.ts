import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getUpdateAgentJob } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing job id' })
  }

  return await getUpdateAgentJob(id)
})
