// Session configuration utility
const DEFAULT_SESSION_PASSWORD = 'your-super-secure-session-password-32-chars-minimum-required-here-for-development'

export function getSessionConfig() {
  const sessionPassword = process.env.SESSION_PASSWORD || DEFAULT_SESSION_PASSWORD
  
  if (sessionPassword.length < 32) {
    throw new Error('SESSION_PASSWORD must be at least 32 characters long. Please set a secure SESSION_PASSWORD environment variable.')
  }
  
  return {
    password: sessionPassword,
    name: 'session',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  }
}
