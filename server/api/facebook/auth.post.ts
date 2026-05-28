import { FacebookTokenService } from '#modula/server/services/facebook/facebookTokenService'

export default defineEventHandler(async (event) => {
  try {
    const { userAccessToken } = await readBody(event)
    
    if (!userAccessToken) {
      throw createError({
        statusCode: 400,
        message: 'User access token is required'
      })
    }

    const facebookTokenService = new FacebookTokenService()
    const pageAccessToken = await facebookTokenService.exchangeUserTokenForPageToken(userAccessToken)

    return { pageAccessToken }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to exchange Facebook tokens'
    })
  }
})
