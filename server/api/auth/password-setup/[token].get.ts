import { AuthService } from '#modula/server/services/auth/authService'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const token = getRouterParam(event, 'token')?.trim() || ''
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token requis' })
  }

  const setup = await authService.validatePasswordSetupToken(token)
  if (!setup) {
    throw createError({ statusCode: 404, statusMessage: 'Lien de configuration invalide ou expiré' })
  }

  return {
    valid: true,
    email: setup.email,
    firstName: setup.firstName,
    lastName: setup.lastName,
    expiresAt: setup.expiresAt.toISOString()
  }
})
