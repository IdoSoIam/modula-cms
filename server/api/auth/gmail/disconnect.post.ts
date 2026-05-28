import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { disconnectGmail } from '#modula/server/utils/gmail'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await disconnectGmail()
  return { ok: true }
})
