import { sendError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // Validation basique
  if (!body.name || !body.email || !body.message) {
    return sendError(event, createError({
      statusCode: 400,
      message: 'Tous les champs sont requis'
    }))
  }

  // Validation email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(body.email)) {
    return sendError(event, createError({
      statusCode: 400,
      message: 'Email invalide'
    }))
  }

  // TODO: Implémenter l'envoi réel d'email
  // Ici vous pouvez intégrer un service d'envoi d'email comme SendGrid, Mailgun, etc.
  
  // Simulation d'envoi réussi
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    success: true,
    message: 'Message envoyé avec succès'
  }
});
