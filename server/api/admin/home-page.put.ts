import type { HomePageContent } from '~/shared/homePage'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { saveHomePageContent } from '~/server/utils/homePage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<HomePageContent>(event)

  if (!body || body.version !== 1 || !Array.isArray(body.sections)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Configuration homepage invalide'
    })
  }

  await saveHomePageContent(body)
  return { ok: true }
})
