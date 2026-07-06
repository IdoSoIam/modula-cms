import { getEnv } from './env'
import { getResendSenderEmail, getSetting, SETTING_KEYS } from './settings'

interface ResendAttachment {
  filename: string
  mimeType: string
  content: string
  contentBase64?: string
}

export interface ResendCalendarInvite {
  filename: string
  mimeType: string
  content: string
}

export async function getResendConfig() {
  const apiKey = (await getSetting(SETTING_KEYS.RESEND_API_KEY))?.trim() || getEnv('RESEND_API_KEY') || ''
  const from = (await getResendSenderEmail()) || getEnv('RESEND_FROM_EMAIL') || ''

  return {
    apiKey,
    from
  }
}

export async function sendResend(opts: {
  to: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  subject: string
  body: string
  htmlBody?: string
  calendarInvite?: ResendCalendarInvite
  attachments?: ResendAttachment[]
}) {
  const config = await getResendConfig()
  if (!config.apiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Resend non configuré (clé API manquante)' })
  }
  if (!config.from) {
    throw createError({ statusCode: 503, statusMessage: 'Resend non configuré (email expéditeur manquant)' })
  }

  const attachments = [
    ...(opts.attachments ?? []).map((attachment) => ({
      filename: attachment.filename,
      content: attachment.contentBase64 || Buffer.from(attachment.content, 'utf-8').toString('base64'),
      type: attachment.mimeType
    })),
    ...(opts.calendarInvite ? [{
      filename: opts.calendarInvite.filename,
      content: Buffer.from(opts.calendarInvite.content, 'utf-8').toString('base64'),
      type: opts.calendarInvite.mimeType
    }] : [])
  ]

  try {
    await $fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: {
        from: config.from,
        to: [opts.to],
        cc: opts.cc?.length ? opts.cc : undefined,
        bcc: opts.bcc?.length ? opts.bcc : undefined,
        reply_to: opts.replyTo ? [opts.replyTo] : undefined,
        subject: opts.subject,
        text: opts.body,
        html: opts.htmlBody,
        attachments: attachments.length ? attachments : undefined
      }
    })
  } catch (error: any) {
    const apiMessage = error?.data?.message
      || error?.data?.error
      || error?.statusMessage
      || error?.message
      || 'Erreur inconnue'

    throw createError({
      statusCode: error?.statusCode || error?.status || 503,
      statusMessage: `Échec Resend: ${apiMessage}`
    })
  }
}
