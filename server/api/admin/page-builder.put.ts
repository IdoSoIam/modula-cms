import type { PageBuilderContent } from '#modula/shared/pageBuilder'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { savePageBuilderContent } from '#modula/server/utils/pageBuilder'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'

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
  await syncImageUsageTable()
  return { ok: true }
})
