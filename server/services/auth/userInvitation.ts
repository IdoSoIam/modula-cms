import { resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'
import { buildGenericEmail } from '#modula/server/utils/orderEmails'
import { getSiteOrigin, sendGmail } from '#modula/server/utils/gmail'

function replaceTemplateVariables(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? '')
}

export async function sendUserInvitationEmail(options: {
  email: string
  firstName?: string
  lastName?: string
  setupToken: string
  expiresAt: Date
  locale?: string
}) {
  const locale = /^[a-z]{2}(?:-[a-z]{2})?$/.test(String(options.locale || '').trim().toLowerCase())
    ? String(options.locale).trim().toLowerCase()
    : 'fr'
  const template = await resolveAdminEmailTemplate('user_invitation', locale)
  const recipientName = [options.firstName, options.lastName].filter(Boolean).join(' ') || options.email
  const localeCode = locale === 'en' ? 'en-GB' : locale === 'fr' ? 'fr-FR' : locale.includes('-') ? locale : `${locale}-${locale.toUpperCase()}`
  const variables = {
    recipientName,
    email: options.email,
    passwordSetupUrl: `${getSiteOrigin()}/password-setup/${options.setupToken}`,
    expiresAt: new Intl.DateTimeFormat(localeCode, {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(options.expiresAt)
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
