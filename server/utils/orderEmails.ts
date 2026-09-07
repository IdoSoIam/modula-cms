import { getEmailBrandingConfig } from './emailBranding'
import { buildEmailHtml } from './emailTemplates'
import { resolveEmailAccentColor } from '#modula/shared/emailCustomization'

export async function buildGenericEmail(options: {
  title: string
  body: string
  accent?: string
  templateAction?: string
  lang?: string
}) {
  const branding = await getEmailBrandingConfig()
  return buildEmailHtml({
    title: options.title,
    body: options.body,
    accent: options.accent || resolveEmailAccentColor(branding.templateAccentColors, options.templateAction, branding.accentColor),
    logoUrl: branding.logoUrl,
    brandName: branding.brandName,
    footer: branding.footerText,
    lang: options.lang
  })
}
