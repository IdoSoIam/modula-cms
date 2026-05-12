import { requireAdmin } from '~/server/utils/requireAdmin'
import { getDaisyUiThemeConfig } from '~/server/utils/themes'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await getDaisyUiThemeConfig()
})
