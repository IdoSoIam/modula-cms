import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getDefaultEmailVisualTemplateConfig, saveEmailVisualTemplateConfig, type EmailVisualTemplateConfig } from '#modula/server/utils/settings'

function normalizeHexColor(input: unknown, fallback: string) {
  if (typeof input !== 'string') return fallback
  const value = input.trim()
  return /^#([0-9a-fA-F]{6})$/.test(value) ? value : fallback
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Partial<EmailVisualTemplateConfig>>(event)
  const fallback = getDefaultEmailVisualTemplateConfig()
  const nextConfig: EmailVisualTemplateConfig = {
    brandName: typeof body.brandName === 'string' && body.brandName.trim() ? body.brandName.trim() : fallback.brandName,
    logoUrl: typeof body.logoUrl === 'string' ? body.logoUrl.trim() : '',
    accentColor: normalizeHexColor(body.accentColor, fallback.accentColor),
    backgroundColor: normalizeHexColor(body.backgroundColor, fallback.backgroundColor),
    cardColor: normalizeHexColor(body.cardColor, fallback.cardColor),
    textColor: normalizeHexColor(body.textColor, fallback.textColor),
    footerText: typeof body.footerText === 'string' ? body.footerText : fallback.footerText,
    buttonRadiusPx: typeof body.buttonRadiusPx === 'number' && Number.isFinite(body.buttonRadiusPx)
      ? Math.max(0, Math.min(28, Math.round(body.buttonRadiusPx)))
      : fallback.buttonRadiusPx
  }

  await saveEmailVisualTemplateConfig(nextConfig)
  return { ok: true, config: nextConfig }
})

