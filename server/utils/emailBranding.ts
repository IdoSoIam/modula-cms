import cmsProjectConfig from '#modula/cms.project.config'
import { getCmsSiteSettings } from '#modula/server/utils/cms'
import { getSiteOrigin } from '#modula/server/utils/gmail'
import { getEmailVisualTemplateConfig } from '#modula/server/utils/settings'

export interface EmailBrandingConfig {
  brandName: string
  logoUrl: string
  footerText: string
  accentColor: string
}

function normalizePublicAssetUrl(value: string | null | undefined) {
  const src = (value || '').trim()
  if (!src) return ''
  if (/^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  if (src.startsWith('/')) return `${getSiteOrigin()}${src}`
  return `${getSiteOrigin()}/images/${src.replace(/^\.?\//, '')}`
}

export function normalizeAdminAssetUrl(value: string | null | undefined) {
  const src = (value || '').trim()
  if (!src) return ''
  if (src.startsWith('/') || /^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  return `/images/${src.replace(/^\.?\//, '')}`
}

export async function getEmailBrandingConfig(): Promise<EmailBrandingConfig> {
  const [emailConfig, siteSettings] = await Promise.all([
    getEmailVisualTemplateConfig(),
    getCmsSiteSettings()
  ])

  const brandName = emailConfig.brandName.trim()
    || siteSettings.siteName.fr.trim()
    || siteSettings.siteName.en.trim()
    || cmsProjectConfig.site.displayName

  const globalLogoSrc = siteSettings.logo.src?.trim() || ''
  const logoUrl = normalizePublicAssetUrl(emailConfig.logoUrl || globalLogoSrc)
  const footerText = emailConfig.footerText.trim() || brandName

  return {
    brandName,
    logoUrl,
    footerText,
    accentColor: emailConfig.accentColor
  }
}
