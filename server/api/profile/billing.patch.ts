import { H3Event } from 'h3'
import { AuthService } from '../../services/auth/authService'
import { getSessionConfig } from '../../utils/session'

const authService = new AuthService()

export default defineEventHandler(async (event: H3Event) => {
  const session = await useSession(event, getSessionConfig(event))
  const userId = session.data.userId

  if (!userId) {
    throw createError({ statusCode: 401, message: 'Authentification requise' })
  }

  const body = await readBody<{
    addressLine1?: string
    addressLine2?: string
    city?: string
    postalCode?: string
    country?: string
  }>(event)
  const addressLine1 = body.addressLine1?.trim() || ''
  const city = body.city?.trim() || ''
  const postalCode = body.postalCode?.trim() || ''
  const country = body.country?.trim() || ''

  if (!addressLine1 || !city || !postalCode || !country) {
    throw createError({ statusCode: 400, message: 'L’adresse, la ville, le code postal et le pays sont requis' })
  }

  const user = await authService.updateBillingAddress(userId, {
    addressLine1,
    addressLine2: body.addressLine2?.trim() || undefined,
    city,
    postalCode,
    country,
  })

  return { user }
})
