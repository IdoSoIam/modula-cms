import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { saveDaisyUiThemeConfig, validateDaisyUiThemeConfigPayload } from '#modula/server/utils/themes'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody(event)
  const config = validateDaisyUiThemeConfigPayload(body)
  await saveDaisyUiThemeConfig(config)
  return { ok: true }
})
