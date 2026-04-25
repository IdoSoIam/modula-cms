import { requireAdmin } from '~/server/utils/requireAdmin'
import { sendGmail } from '~/server/utils/gmail'
import { prisma } from '../../../../../prisma/client'

interface Body {
  decision: 'CONFIRMED' | 'REJECTED'
  adminNote?: string
  email: { subject: string; body: string }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<Body>(event)
  if (body.decision !== 'CONFIRMED' && body.decision !== 'REJECTED') {
    throw createError({ statusCode: 400, statusMessage: 'Décision invalide' })
  }
  if (!body.email?.subject || !body.email?.body) {
    throw createError({ statusCode: 400, statusMessage: 'Email vide' })
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } })
  if (!reservation) throw createError({ statusCode: 404, statusMessage: 'Réservation introuvable' })

  await sendGmail({
    to: reservation.email,
    subject: body.email.subject,
    body: body.email.body
  })

  const updated = await prisma.reservation.update({
    where: { id },
    data: {
      status: body.decision,
      adminNote: body.adminNote ?? null,
      confirmedAt: body.decision === 'CONFIRMED' ? new Date() : null
    }
  })

  return { ok: true, status: updated.status }
})
