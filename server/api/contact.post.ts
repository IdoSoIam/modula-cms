import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail } from '~/server/utils/reservationEmails'
import { getSetting, SETTING_KEYS } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string; email?: string; message?: string }>(event)

  if (!body.name?.trim() || !body.email?.trim() || !body.message?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tous les champs sont requis'
    })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email invalide'
    })
  }

  const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
  if (!adminEmail) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Adresse email admin non configuree'
    })
  }

  await sendGmail({
    to: adminEmail,
    subject: `Nouveau message de contact - ${body.name.trim()}`,
    body: `Nouveau message depuis le formulaire de contact :

- Nom : ${body.name.trim()}
- Email : ${body.email.trim()}

Message :
${body.message.trim()}`,
    htmlBody: buildGenericEmail({
      title: `Nouveau message de contact - ${body.name.trim()}`,
      body: `Nouveau message depuis le formulaire de contact :

- Nom : ${body.name.trim()}
- Email : ${body.email.trim()}

Message :
${body.message.trim()}`,
      accent: '#2563eb'
    })
  })

  return {
    success: true,
    message: 'Message envoye avec succes'
  }
})
