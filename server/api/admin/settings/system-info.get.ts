import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getCurrentCmsRuntimeTarget } from '#modula/server/utils/settings'
import { getPdfRuntimeDiagnostics } from '#modula/server/utils/pdf'
import { getSystemInfo } from '#modula/server/utils/systemInfo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const runtimeTarget = getCurrentCmsRuntimeTarget()
  const [systemInfo, pdf] = await Promise.all([
    getSystemInfo(runtimeTarget),
    getPdfRuntimeDiagnostics(),
  ])

  return {
    systemInfo,
    pdf,
  }
})
