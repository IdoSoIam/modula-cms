import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  const user = await authService.getUserFromSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }
  return { user }
})
