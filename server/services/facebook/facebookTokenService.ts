import { PrismaClient } from '@prisma/client'
import fbModule from 'fb'
import type { FacebookPagesResponse, FacebookError, FacebookPage } from '~/types/facebook'

const FB = fbModule
const prisma = new PrismaClient()

export class FacebookTokenService {
  private static FB_PAGE_ACCESS_TOKEN_KEY = 'fb_page_access_token'

  constructor() {
    FB.options({
      appId: process.env.FACEBOOK_APP_ID,
      appSecret: process.env.FACEBOOK_APP_SECRET,
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
      const page = (response.data as FacebookPage[]).find(p => p.id === process.env.FACEBOOK_PAGE_ID)
      
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
