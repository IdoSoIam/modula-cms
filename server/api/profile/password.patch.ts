import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  try {
    const session = await useSession(event, getSessionConfig(event))
    const userId = session.data.userId

    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized'
      })
    }

    const { currentPassword, newPassword } = await readBody(event)

    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Current password and new password are required'
      })
    }

    if (newPassword.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be at least 8 characters long'
      })
    }

    await authService.changePassword(userId, currentPassword, newPassword)

    return { message: 'Password changed successfully' }
  } catch (error: any) {
    console.error('Password change error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during password change'
    })
  }
})
