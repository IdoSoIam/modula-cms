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

    const { 
      addressLine1, 
      addressLine2, 
      city, 
      postalCode, 
      country 
    } = await readBody(event)

    if (!addressLine1 || !city || !postalCode || !country) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Address line 1, city, postal code, and country are required'
      })
    }

    const updatedUser = await authService.updateShippingAddress(userId, {
      addressLine1,
      addressLine2,
      city,
      postalCode,
      country
    })

    return { user: updatedUser }
  } catch (error: any) {
    console.error('Shipping address update error:', error)
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during shipping address update'
    })
  }
})
