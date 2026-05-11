import { requireAdmin } from '~/server/utils/requireAdmin'
import { saveCmsPage, validateCmsPagePayload } from '~/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant invalide'
    })
  }

  const body = validateCmsPagePayload(await readBody(event))
  const page = await saveCmsPage(id, body)

  if (!page) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Page introuvable ou tables CMS non disponibles'
    })
  }

  return page
})
