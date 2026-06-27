import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getLlmApiKey } from '#modula/server/utils/settings'

interface Body {
  text: string
  sourceLocale: string
  targetLocales: string[]
  context?: string
}

const translationCache = new Map<string, string>()
let lastThrottleReset = Date.now()
let throttleCount = 0
const THROTTLE_MAX = 50
const THROTTLE_WINDOW_MS = 60_000

function cacheKey(text: string, sourceLocale: string, targetLocale: string): string {
  return `${sourceLocale}:${targetLocale}:${text}`
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
    const errText = await response.text().catch(() => 'Unknown error')
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

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.text?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing text' })
  }
  if (!body.sourceLocale || !body.targetLocales?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing sourceLocale or targetLocales' })
  }

  const apiKey = await getLlmApiKey()
  if (!apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'LLM API key not configured' })
  }

  const translations: Record<string, string> = {}

  await Promise.all(
    body.targetLocales.map(async (target) => {
      if (target === body.sourceLocale) {
        translations[target] = body.text
        return
      }
      try {
        translations[target] = await translateSingle(body.text, body.sourceLocale, target, apiKey)
      } catch {
        translations[target] = ''
      }
    })
  )

  return { translations }
})
