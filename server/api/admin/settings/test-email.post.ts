import { requireAdmin } from '~/server/utils/requireAdmin'
import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail } from '~/server/utils/reservationEmails'
import { formatDateTimeLabel, getDefaultTimeZone } from '~/server/utils/dateFormat'
import { getReservationNotificationEmail, getSettings, SETTING_KEYS } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [reservationNotificationEmail, settings] = await Promise.all([
    getReservationNotificationEmail(),
    getSettings([
      SETTING_KEYS.MAIL_PRIMARY_PROVIDER,
      SETTING_KEYS.MAIL_SECONDARY_PROVIDER,
      SETTING_KEYS.GMAIL_SENDER_EMAIL,
      SETTING_KEYS.RESEND_FROM_EMAIL,
      SETTING_KEYS.CONTACT_EMAIL
    ])
  ])

  if (!reservationNotificationEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Adresse de notification des réservations non configurée'
    })
  }

  const primaryProvider = settings[SETTING_KEYS.MAIL_PRIMARY_PROVIDER] || 'gmail'
  const secondaryProvider = settings[SETTING_KEYS.MAIL_SECONDARY_PROVIDER] || 'resend'
  const gmailSenderEmail = settings[SETTING_KEYS.GMAIL_SENDER_EMAIL] || 'non défini'
  const resendSenderEmail = settings[SETTING_KEYS.RESEND_FROM_EMAIL] || 'non défini'
  const contactEmail = settings[SETTING_KEYS.CONTACT_EMAIL] || 'non défini'
  const sentAt = formatDateTimeLabel(new Date(), 'fr-FR')

  const body = [
    'Ceci est un email de test envoyé depuis la page Paramètres.',
    '',
    `Date : ${sentAt}`,
    `Timezone serveur : ${getDefaultTimeZone()}`,
    `Provider principal : ${primaryProvider}`,
    `Provider secondaire : ${secondaryProvider}`,
    `Email expéditeur Gmail : ${gmailSenderEmail}`,
    `Email expéditeur Resend : ${resendSenderEmail}`,
    `Email notifications réservations : ${reservationNotificationEmail}`,
    `Email de contact public : ${contactEmail}`
  ].join('\n')

  await sendGmail({
    to: reservationNotificationEmail,
    subject: '[Test email] Configuration de la ferme',
    body,
    htmlBody: buildGenericEmail({
      title: 'Test email',
      body,
      accent: '#2563eb',
      lang: 'fr'
    })
  })

  return { ok: true }
})
