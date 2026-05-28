import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { duplicateCmsPage } from '#modula/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant invalide'
    })
  }

  const page = await duplicateCmsPage(id)
  if (!page) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Page introuvable'
    })
  }

  return page
})
