import { getPageBuilderContent } from '~/server/utils/pageBuilder'

export default defineEventHandler(async () => {
  return await getPageBuilderContent()
})
