import type { PageBuilderContent } from '~/shared/pageBuilder'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { savePageBuilderContent } from '~/server/utils/pageBuilder'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<PageBuilderContent>(event)

  if (!body || body.version !== 1 || !Array.isArray(body.sections)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Configuration du constructeur de page invalide'
    })
  }

  await savePageBuilderContent(body)
  return { ok: true }
})
