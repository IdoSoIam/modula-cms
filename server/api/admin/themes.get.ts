import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getDaisyUiThemeConfig } from '#modula/server/utils/themes'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getDaisyUiThemeConfig()
})
