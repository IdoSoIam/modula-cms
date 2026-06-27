import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getSiteLocales, getLlmApiKey } from '#modula/server/utils/settings'
import { db } from '#modula/server/data/client'

const translationCache = new Map<string, string>()
let lastThrottleReset = Date.now()
let throttleCount = 0
const THROTTLE_MAX = 50
const THROTTLE_WINDOW_MS = 60_000

function cacheKey(text: string, sourceLocale: string, targetLocale: string): string {
  return `translate-all:${sourceLocale}:${targetLocale}:${text}`
}

function checkThrottle() {
  const now = Date.now()
  if (now - lastThrottleReset > THROTTLE_WINDOW_MS) {
    throttleCount = 0
    lastThrottleReset = now
  }
  throttleCount++
  if (throttleCount > THROTTLE_MAX) {
    throw createError({ statusCode: 429, statusMessage: '429 Too Many Requests — LLM rate limit exceeded' })
  }
}

async function translateSingle(text: string, sourceLocale: string, targetLocale: string, apiKey: string): Promise<string> {
  const key = cacheKey(text, sourceLocale, targetLocale)
  const cached = translationCache.get(key)
  if (cached) return cached

  checkThrottle()

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate from ${sourceLocale.toUpperCase()} to ${targetLocale.toUpperCase()}. Return ONLY the translated text, no explanations, no quotes.\n\n${sourceLocale.toUpperCase()}: ${text}\n${targetLocale.toUpperCase()}:`
          }]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
      })
    }
  )

  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: `LLM API error: ${response.status}` })
  }

  const json = await response.json()
  const translated = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

  if (translated) {
    translationCache.set(key, translated)
    if (translationCache.size > 500) {
      const firstKey = translationCache.keys().next().value
      if (firstKey) translationCache.delete(firstKey)
    }
  }

  return translated
}

interface PageTranslation {
  title?: string
  navigationLabel?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: string
    noindex?: boolean
  }
  content?: unknown
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [siteLocales, apiKey] = await Promise.all([
    getSiteLocales(),
    getLlmApiKey()
  ])

  if (!apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'LLM API key not configured' })
  }

  if (siteLocales.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'At least 2 locales required for translation' })
  }

  const defaultLocale = siteLocales[0]!
  if (!defaultLocale) {
    throw createError({ statusCode: 400, statusMessage: 'No default locale configured' })
  }
  const targetLocales = siteLocales.filter(l => l !== defaultLocale)

  const rows = await db.cmsPage.findMany()
  let translated = 0

  for (const row of rows) {
    let translations: Record<string, PageTranslation>
    try {
      translations = JSON.parse(row.translationsJson)
    } catch {
      continue
    }

    const source = translations[defaultLocale]
    if (!source) continue

    let pageUpdated = false

    for (const targetLocale of targetLocales) {
      const target = translations[targetLocale] || { title: '', navigationLabel: '', seo: { metaTitle: '', metaDescription: '', ogImage: '', noindex: false }, content: undefined }

      // Translate title
      if (source.title && !target.title) {
        try {
          target.title = await translateSingle(source.title, defaultLocale, targetLocale, apiKey)
          if (target.title) pageUpdated = true
        } catch { /* skip field */ }
      }

      // Translate navigationLabel
      if (source.navigationLabel && !target.navigationLabel) {
        try {
          target.navigationLabel = await translateSingle(source.navigationLabel, defaultLocale, targetLocale, apiKey)
          if (target.navigationLabel) pageUpdated = true
        } catch { /* skip field */ }
      }

      // Translate seo.metaTitle
      const sourceSeoTitle = source.seo?.metaTitle
      if (sourceSeoTitle && !target.seo?.metaTitle) {
        try {
          if (!target.seo) target.seo = { metaTitle: '', metaDescription: '', ogImage: '', noindex: false }
          target.seo.metaTitle = await translateSingle(sourceSeoTitle, defaultLocale, targetLocale, apiKey)
          if (target.seo.metaTitle) pageUpdated = true
        } catch { /* skip field */ }
      }

      // Translate seo.metaDescription
      const sourceSeoDesc = source.seo?.metaDescription
      if (sourceSeoDesc && !target.seo?.metaDescription) {
        try {
          if (!target.seo) target.seo = { metaTitle: '', metaDescription: '', ogImage: '', noindex: false }
          target.seo.metaDescription = await translateSingle(sourceSeoDesc, defaultLocale, targetLocale, apiKey)
          if (target.seo.metaDescription) pageUpdated = true
        } catch { /* skip field */ }
      }

      if (pageUpdated) {
        translations[targetLocale] = target
      }
    }

    if (pageUpdated) {
      translated++
      await db.cmsPage.update({
        where: { id: row.id },
        data: { translationsJson: JSON.stringify(translations) }
      })
    }
  }

  return { translated }
})
