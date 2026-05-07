import { getHomePageContent } from '~/server/utils/homePage'

export default defineEventHandler(async () => {
  return await getHomePageContent()
})
