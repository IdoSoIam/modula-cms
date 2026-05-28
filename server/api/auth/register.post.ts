import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'
import { prisma } from '../../../prisma/client'
import { isRegisterEnabled } from '#modula/server/utils/settings'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  try {
    setResponseHeader(event, 'Cache-Control', 'no-store')
    const userCount = await prisma.user.count()
    const registerEnabled = await isRegisterEnabled()
    if (!registerEnabled && userCount > 0) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Public registration is disabled'
      })
    }

    const { email, password, firstName, lastName, birthDate } = await readBody(event)

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Convert birthDate string to Date object if provided
    const birthDateObj = birthDate ? new Date(birthDate) : undefined;

    // First registered user becomes admin (bootstrap)
    const role = userCount === 0 ? 'admin' : 'user'

    const user = await authService.createUser(email, password, firstName, lastName, birthDateObj, role)
    const session = await useSession(event, getSessionConfig())
    await session.clear()
    await session.update({
      userId: user.id
    })

    return { user }
  } catch (error: any) {
    console.error('Register error:', error)
    if (error.code === 'P2002') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email already exists'
      })
    }
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during registration'
    })
  }
})
