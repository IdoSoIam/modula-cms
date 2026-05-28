import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { ensureCmsRootPage } from '#modula/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = await ensureCmsRootPage()
  if (!id) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible d’initialiser la page CMS racine'
    })
  }

  return { id }
})
