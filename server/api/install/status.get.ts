import { getCmsInstallStatus } from '#modula/server/utils/install'
import { listSiteTemplates } from '#modula/server/utils/siteTemplates'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return {
    ...(await getCmsInstallStatus()),
    siteTemplates: listSiteTemplates()
  }
})
