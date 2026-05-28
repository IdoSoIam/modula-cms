import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { saveCmsPage, validateCmsPagePayload } from '#modula/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = validateCmsPagePayload(await readBody(event))
  const page = await saveCmsPage(null, body)
  if (!page) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Les tables CMS ne sont pas encore disponibles. Applique d abord la migration.'
    })
  }
  return page
})
