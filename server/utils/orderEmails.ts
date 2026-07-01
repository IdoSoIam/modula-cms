import { getEmailBrandingConfig } from './emailBranding'
import { buildEmailHtml } from './emailTemplates'

export async function buildGenericEmail(options: {
  title: string
  body: string
  accent?: string
  lang?: string
}) {
  const branding = await getEmailBrandingConfig()
  return buildEmailHtml({
    title: options.title,
    body: options.body,
    accent: options.accent || branding.accentColor,
    logoUrl: branding.logoUrl,
    brandName: branding.brandName,
    footer: branding.footerText,
    lang: options.lang
  })
}
