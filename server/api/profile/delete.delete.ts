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
    }

    const { password, confirmDelete } = await readBody(event)

    if (!password || !confirmDelete) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Password and confirmation are required'
      })
    }

    if (confirmDelete !== 'DELETE_MY_ACCOUNT') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Confirmation text must be exactly "DELETE_MY_ACCOUNT"'
      })
    }

    await authService.deleteAccount(userId, password)

    // Clear session after account deletion
    await session.clear()

    return { message: 'Account deleted successfully' }
  } catch (error: any) {
    console.error('Account deletion error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during account deletion'
    })
  }
})
