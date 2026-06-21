import { resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'
import { buildGenericEmail } from '#modula/server/utils/orderEmails'
import { sendGmail } from '#modula/server/utils/gmail'
import { getEmailBrandingConfig } from '#modula/server/utils/emailBranding'

function replaceTemplateVariables(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? '')
}

export async function sendUserSignupConfirmationEmail(options: {
  email: string
  firstName?: string
  lastName?: string
  locale?: 'fr' | 'en'
}) {
  const locale = options.locale === 'en' ? 'en' : 'fr'
  const template = await resolveAdminEmailTemplate('signup_request_confirmation', locale)
  const branding = await getEmailBrandingConfig()
  const applicantName = [options.firstName, options.lastName].filter(Boolean).join(' ') || options.email
  const variables = {
    signupLabel: branding.brandName,
    applicantName
  }
  const subject = replaceTemplateVariables(template.subject, variables)
  const body = replaceTemplateVariables(template.body, variables)

  await sendGmail({
    to: options.email,
    subject,
    body,
    htmlBody: await buildGenericEmail({
      title: subject,
      body,
      accent: '#4f8a34',
      lang: locale
    })
  })
}
