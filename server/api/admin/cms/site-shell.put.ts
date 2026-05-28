import { requireAdmin } from '#modula/server/utils/requireAdmin'
import {
  saveCmsNavigationItems,
  saveCmsSiteSettings,
  validateCmsNavigationItemsPayload,
  validateCmsSiteSettingsPayload
} from '#modula/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)

  const settings = validateCmsSiteSettingsPayload(body?.settings)
  const navigation = validateCmsNavigationItemsPayload(body?.navigation)

  await saveCmsSiteSettings(settings)
  await saveCmsNavigationItems(navigation)

  return { ok: true }
})
