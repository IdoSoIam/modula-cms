import { AuthService } from '#modula/server/services/auth/authService'
import { getSessionConfig } from '#modula/server/utils/session'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const token = getRouterParam(event, 'token')?.trim() || ''
  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token requis' })
  }

  const body = await readBody<{ password?: string }>(event)
  const password = typeof body.password === 'string' ? body.password : ''
  if (!password.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Mot de passe requis' })
  }

  const user = await authService.setPasswordFromSetupToken(token, password)
  const session = await useSession(event, getSessionConfig(event))
  await session.clear()
  await session.update({ userId: user.id })

  return { ok: true, user }
})
