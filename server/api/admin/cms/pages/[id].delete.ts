import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteCmsPage } from '#modula/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Identifiant invalide'
    })
  }

  await deleteCmsPage(id)
  return { ok: true }
})
