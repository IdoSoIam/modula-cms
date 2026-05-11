import { applyDefaultSectionStyling } from '~/shared/homePage'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { getHomePageContent, saveHomePageContent } from '~/server/utils/homePage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const content = await getHomePageContent()
  applyDefaultSectionStyling(content)
  await saveHomePageContent(content)

  return { ok: true, message: 'Couleurs réinitialisées avec succès' }
})
