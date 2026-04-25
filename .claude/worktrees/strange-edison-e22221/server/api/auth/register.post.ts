import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  try {
    const { email, password, firstName, lastName, birthDate } = await readBody(event)

    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // Convert birthDate string to Date object if provided
    const birthDateObj = birthDate ? new Date(birthDate) : undefined;
    
    const user = await authService.createUser(email, password, firstName, lastName, birthDateObj)
    const session = await useSession(event, getSessionConfig())
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
