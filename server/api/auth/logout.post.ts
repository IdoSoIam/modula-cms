import { AuthService } from '../../services/auth/authService'
import { H3Event } from 'h3'
import { getSessionConfig } from '../../utils/session'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const session = await useSession(event, getSessionConfig())
  await session.clear()
  return { success: true }
})
