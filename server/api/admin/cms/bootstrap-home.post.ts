import { requireAdmin } from '~/server/utils/requireAdmin'
import { ensureCmsHomePage } from '~/server/utils/cms'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = await ensureCmsHomePage()
  if (!id) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Impossible d’initialiser la page CMS d’accueil'
    })
  }

  return { id }
})
