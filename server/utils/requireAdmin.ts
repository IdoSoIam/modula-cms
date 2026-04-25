import type { H3Event } from 'h3'
import { AuthService } from '../services/auth/authService'

const authService = new AuthService()

export async function requireAdmin(event: H3Event) {
  const user = await authService.getUserFromSession(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }
  return user
}
