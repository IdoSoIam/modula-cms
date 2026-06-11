import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'
import { enforceRateLimit } from '../../utils/rateLimit'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  try {
    setResponseHeader(event, 'Cache-Control', 'no-store')
    enforceRateLimit(event, {
      key: 'auth-login',
      limit: 5,
      windowMs: 15 * 60 * 1000,
      message: 'Trop de tentatives de connexion. Réessayez plus tard.'
    })

    const { email, password } = await readBody(event)
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!normalizedEmail || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    const user = await authService.validateUser(normalizedEmail, password)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    const session = await useSession(event, getSessionConfig(event))
    await session.clear()
    await session.update({
      userId: user.id
    })

    return { user }
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during login'
    })
  }
})
