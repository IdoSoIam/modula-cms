import { saveEvent } from '#modula/server/services/events/saveEvent'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const user = await requirePermission(event, 'events', 'create')
  return saveEvent(await readBody(event), user.id)
})
