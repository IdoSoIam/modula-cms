import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await useSession(event, getSessionConfig())
    const userId = session.data.userId

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }    const { firstName, lastName, email } = await readBody(event)

    if (!firstName || !lastName || !email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'First name, last name, and email are required'
      })
    }

    const updatedUser = await authService.updateProfile(userId, {
      firstName,
      lastName,
      email
    })

    return { user: updatedUser }
  } catch (error: any) {
    console.error('Profile update error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during profile update'
    })
  }
})
