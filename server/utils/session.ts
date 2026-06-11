import { getEnv } from './env'
import type { H3Event } from 'h3'
import { getRequestHeader } from 'h3'

// Session configuration utility
const DEFAULT_SESSION_PASSWORD = 'your-super-secure-session-password-32-chars-minimum-required-here-for-development'

function resolveSecureSessionCookie(event?: H3Event) {
  const explicit = (getEnv('SESSION_COOKIE_SECURE') || '').trim().toLowerCase()
  if (explicit === 'true' || explicit === '1' || explicit === 'yes') return true
  if (explicit === 'false' || explicit === '0' || explicit === 'no') return false

  if (event) {
    const forwardedProto = getRequestHeader(event, 'x-forwarded-proto')
    const forwardedSsl = getRequestHeader(event, 'x-forwarded-ssl')
    if (forwardedProto?.split(',')[0]?.trim()?.toLowerCase() === 'https') return true
    if ((forwardedSsl || '').trim().toLowerCase() === 'on') return true
    const origin = getRequestHeader(event, 'origin') || getRequestHeader(event, 'referer') || ''
    if (origin.startsWith('https://')) return true
  }

  return process.env.NODE_ENV === 'production' && !event
}

export function getSessionConfig(event?: H3Event) {
  const sessionPassword = getEnv('SESSION_PASSWORD') || DEFAULT_SESSION_PASSWORD
  const secureCookie = resolveSecureSessionCookie(event)
  
  if (sessionPassword.length < 32) {
    throw new Error('SESSION_PASSWORD must be at least 32 characters long. Please set a secure SESSION_PASSWORD environment variable.')
  }
  
  return {
    password: sessionPassword,
    name: secureCookie ? '__Host-session' : 'session',
    cookie: {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax' as const,
      path: '/'
    },
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}
