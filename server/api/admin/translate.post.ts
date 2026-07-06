import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { translateRegistryTexts } from '#modula/server/utils/cmsRegistry'

interface Body {
  text: string
  sourceLocale: string
  targetLocales: string[]
  context?: string
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.text?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing text' })
  }

  if (!body.sourceLocale || !body.targetLocales?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sourceLocale or targetLocales' })
  }

  const uniqueTargets = Array.from(new Set(
    body.targetLocales
      .map((locale) => String(locale || '').trim().toLowerCase())
      .filter(Boolean)
  ))

  const translations: Record<string, string> = {}
  const pendingTargets = uniqueTargets.filter((locale) => locale !== body.sourceLocale)

  if (uniqueTargets.includes(body.sourceLocale)) {
    translations[body.sourceLocale] = body.text
  }

  if (pendingTargets.length) {
    const response = await translateRegistryTexts(
      pendingTargets.map((targetLocale) => ({
        text: body.text,
        sourceLocale: body.sourceLocale,
        targetLocale
      }))
    )

    for (const item of response.items) {
      translations[item.targetLocale] = item.translatedText || ''
    }
  }

  return { translations }
})
