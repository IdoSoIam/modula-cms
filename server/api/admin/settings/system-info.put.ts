import { requireAdmin } from '#modula/server/utils/requireAdmin'
import {
  getCurrentCmsRuntimeTarget,
  savePdfRendererMode,
  type PdfRendererMode,
} from '#modula/server/utils/settings'
import { getPdfRuntimeDiagnostics } from '#modula/server/utils/pdf'
import { getSystemInfo } from '#modula/server/utils/systemInfo'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ pdfRendererMode?: PdfRendererMode }>(event)
  const runtimeTarget = getCurrentCmsRuntimeTarget()

  if (runtimeTarget === 'cloudflare') {
    await savePdfRendererMode('external')
  } else {
    const requestedMode = body?.pdfRendererMode === 'external' ? 'external' : 'local'
    await savePdfRendererMode(requestedMode)
  }

  const [systemInfo, pdf] = await Promise.all([
    getSystemInfo(runtimeTarget),
    getPdfRuntimeDiagnostics(),
  ])

  return {
    ok: true,
    systemInfo,
    pdf,
  }
})
