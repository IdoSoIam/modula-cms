import { applyDefaultSectionStyling } from '~/shared/pageBuilder'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { getPageBuilderContent, savePageBuilderContent } from '~/server/utils/pageBuilder'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const content = await getPageBuilderContent()
  applyDefaultSectionStyling(content)
  await savePageBuilderContent(content)

  return { ok: true, message: 'Couleurs réinitialisées avec succès' }
})
