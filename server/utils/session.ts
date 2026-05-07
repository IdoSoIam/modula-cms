import { getEnv } from './env'

// Session configuration utility
const DEFAULT_SESSION_PASSWORD = 'your-super-secure-session-password-32-chars-minimum-required-here-for-development'

export function getSessionConfig() {
  const sessionPassword = getEnv('SESSION_PASSWORD') || DEFAULT_SESSION_PASSWORD
  const isProduction = process.env.NODE_ENV === 'production'
  
  if (sessionPassword.length < 32) {
    throw new Error('SESSION_PASSWORD must be at least 32 characters long. Please set a secure SESSION_PASSWORD environment variable.')
  }
  
  return {
    password: sessionPassword,
    name: isProduction ? '__Host-session' : 'session',
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/'
    },
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}
