import fbModule from 'fb'
import type { FacebookPagesResponse, FacebookError, FacebookPage } from '#modula/types/facebook'
import { prisma } from '../../../prisma/client'
import { getEnv } from '#modula/server/utils/env'

const FB = fbModule

export class FacebookTokenService {
  private static FB_PAGE_ACCESS_TOKEN_KEY = 'fb_page_access_token'

  constructor() {
    FB.options({
      appId: getEnv('FACEBOOK_APP_ID'),
      appSecret: getEnv('FACEBOOK_APP_SECRET'),
      version: 'v17.0'
    })
  }

  async storePageAccessToken(accessToken: string): Promise<void> {
    try {
      await prisma.siteParams.upsert({
        where: {
          key: FacebookTokenService.FB_PAGE_ACCESS_TOKEN_KEY
        },
        update: {
          value: accessToken
        },
        create: {
          key: FacebookTokenService.FB_PAGE_ACCESS_TOKEN_KEY,
          value: accessToken
        }
      })
    } catch (error) {
      console.error('Error storing Facebook page access token:', error)
      throw error
    }
  }

  async getPageAccessToken(): Promise<string | null> {
    try {
      const token = await prisma.siteParams.findUnique({
        where: {
          key: FacebookTokenService.FB_PAGE_ACCESS_TOKEN_KEY
        }
      })
      return token?.value || null
    } catch (error) {
      console.error('Error retrieving Facebook page access token:', error)
      throw error
    }
  }

  async exchangeUserTokenForPageToken(userAccessToken: string): Promise<string> {
    try {      // Get user's pages
      const response = await FB.api('me/accounts', {
        access_token: userAccessToken
      })

      if (!response || !response.data) {
        throw new Error('Failed to get page access token')
      }

      // Find the page we want
      const pageId = getEnv('FACEBOOK_PAGE_ID')
      const page = (response.data as FacebookPage[]).find(p => p.id === pageId)

      if (!page) {
        throw new Error('Page not found in user\'s pages')
      }

      // Store the page access token
      await this.storePageAccessToken(page.access_token)

      return page.access_token
    } catch (error) {
      console.error('Error exchanging token:', error)
      if (error && (error as FacebookError).message) {
        throw new Error(`Facebook API error: ${(error as FacebookError).message}`)
      }
      throw error
    }
  }
}
