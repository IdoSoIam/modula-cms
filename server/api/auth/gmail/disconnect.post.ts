import { requireAdmin } from '~/server/utils/requireAdmin'
import { disconnectGmail } from '~/server/utils/gmail'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await disconnectGmail()
  return { ok: true }
})
