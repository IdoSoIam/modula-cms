import { prisma } from '~/prisma/client'
import { AuthService } from '~/server/services/auth/authService'
import { resolveAdminEmailTemplate } from '~/server/utils/adminEmailTemplates'
import { getSiteOrigin, sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail } from '~/server/utils/orderEmails'
import { requirePermission } from '~/server/utils/permissions'

const authService = new AuthService()

function replaceTemplateVariables(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? '')
}

async function sendInvitationEmail(options: {
  email: string
  firstName?: string | null
  lastName?: string | null
  setupToken: string
  expiresAt: Date
}) {
  const template = await resolveAdminEmailTemplate('user_invitation', 'fr')
  const recipientName = [options.firstName, options.lastName].filter(Boolean).join(' ') || options.email
  const variables = {
    recipientName,
    email: options.email,
    passwordSetupUrl: `${getSiteOrigin()}/password-setup/${options.setupToken}`,
    expiresAt: new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(options.expiresAt)
  }
  const subject = replaceTemplateVariables(template.subject, variables)
  const body = replaceTemplateVariables(template.body, variables)

  await sendGmail({
    to: options.email,
    subject,
    body,
    htmlBody: buildGenericEmail({
      title: subject,
      body,
      accent: '#4f8a34',
      lang: 'fr'
    })
  })
}

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant utilisateur invalide' })
  }

  const body = await readBody<{ sendEmail?: boolean; action?: string; setupToken?: string; ttlHours?: number }>(event)

  // Mode "send-email": envoie l'email avec un token existant sans en générer un nouveau
  if (body?.action === 'send-email') {
    if (!body.setupToken) {
      throw createError({ statusCode: 400, statusMessage: 'Token requis' })
    }

    const validation = await authService.validatePasswordSetupToken(body.setupToken)
    if (!validation) {
      throw createError({ statusCode: 404, statusMessage: 'Token invalide ou expiré. Générez un nouveau lien d\'invitation.' })
    }

    await sendInvitationEmail({
      email: validation.email,
      firstName: validation.firstName,
      lastName: validation.lastName,
      setupToken: body.setupToken,
      expiresAt: validation.expiresAt
    })

    return { sent: true }
  }

  // Mode normal : génération d'un nouveau token
  const sendEmail = body?.sendEmail === true

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true
    }
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
  }

  if (user.isActive) {
    throw createError({ statusCode: 400, statusMessage: 'Cet utilisateur est déjà actif' })
  }

  let setupToken: string
  let expiresAt: Date
  try {
    const ttlMs = body?.ttlHours ? body.ttlHours * 60 * 60 * 1000 : undefined
    const createdToken = await authService.createPasswordSetupToken(user.id, ttlMs)
    setupToken = createdToken.token
    expiresAt = createdToken.expiresAt
  } catch (error) {
    console.error('Error creating password setup token:', error)
    throw createError({ statusCode: 500, statusMessage: 'Impossible de générer le lien d\'invitation' })
  }

  let sent = false
  if (sendEmail) {
    await sendInvitationEmail({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      setupToken,
      expiresAt
    })
    sent = true
  }

  return {
    link: `${getSiteOrigin()}/password-setup/${setupToken}`,
    setupToken,
    sent
  }
})
