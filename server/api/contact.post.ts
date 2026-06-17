import { sendGmail } from '#modula/server/utils/gmail'
import { buildGenericEmail } from '#modula/server/utils/orderEmails'
import { getContactEmail } from '#modula/server/utils/settings'
import { resolveTemplateFromSettings, applyTemplateVars, getReservationEmailHtmlLang } from '#modula/server/utils/orderEmailContent'
import { enforceRateLimit } from '#modula/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  enforceRateLimit(event, {
    key: 'contact-form',
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Trop de messages envoyés. Réessayez plus tard.'
  })

  const body = await readBody<{ name?: string; email?: string; message?: string; website?: string; formStartedAt?: number }>(event)

  if (body.website?.trim()) {
    return {
      success: true,
      message: 'Message envoyé avec succès'
    }
  }

  if (!body.formStartedAt || Date.now() - body.formStartedAt < 2000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Envoi du formulaire refusé'
    })
  }

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

  const contactEmail = await getContactEmail()
  if (!contactEmail) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Adresse email de contact non configurée'
    })
  }

  const tpl = await resolveTemplateFromSettings('contact', 'fr')
  const email = applyTemplateVars(tpl, {
    contactName: body.name.trim(),
    contactEmail: body.email.trim(),
    contactMessage: body.message.trim()
  })

  await sendGmail({
    to: contactEmail,
    subject: email.subject,
    body: email.body,
    htmlBody: await buildGenericEmail({
      title: email.subject,
      body: email.body,
      accent: '#2563eb',
      lang: getReservationEmailHtmlLang('fr')
    })
  })

  return {
    success: true,
    message: 'Message envoyé avec succès'
  }
})
