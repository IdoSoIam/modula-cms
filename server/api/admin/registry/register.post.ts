import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { registerRegistryInstance } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await registerRegistryInstance()
})
