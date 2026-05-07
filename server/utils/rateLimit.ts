import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'

interface RateLimitOptions {
  key: string
  limit: number
  windowMs: number
  message: string
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}

export function enforceRateLimit(event: H3Event, options: RateLimitOptions) {
  const now = Date.now()
  pruneExpiredEntries(now)

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const rateLimitKey = `${options.key}:${ip}`
  const current = store.get(rateLimitKey)

  if (!current || current.resetAt <= now) {
    store.set(rateLimitKey, {
      count: 1,
      resetAt: now + options.windowMs
    })
    return
  }

  if (current.count >= options.limit) {
    throw createError({
      statusCode: 429,
      statusMessage: options.message
    })
  }

  current.count += 1
  store.set(rateLimitKey, current)
}
