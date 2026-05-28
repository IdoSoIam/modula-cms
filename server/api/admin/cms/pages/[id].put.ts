import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCmsPageById, saveCmsPage, validateCmsPagePayload } from '#modula/server/utils/cms'

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

  const normalizedPage = await getCmsPageById(page.id)
  if (!normalizedPage) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Page enregistrée mais réponse CMS introuvable'
    })
  }

  return normalizedPage
})
