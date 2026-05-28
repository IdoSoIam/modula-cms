import { getPageBuilderContent } from '#modula/server/utils/pageBuilder'

export default defineEventHandler(async () => {
  return await getPageBuilderContent()
})
