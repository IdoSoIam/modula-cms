import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { triggerUpdateAgentRollback } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ mode?: 'fast' | 'full' }>(event).catch(() => null)
  const mode = body?.mode === 'full' ? 'full' : 'fast'
  return await triggerUpdateAgentRollback(mode)
})
