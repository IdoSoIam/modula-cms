import { prisma } from '~/prisma/client'
import { listAudienceEligibleUsers, sendParticipationCall } from '~/server/utils/events'
import { requireSpecialPermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requireSpecialPermission(event, 'send_event_participation_emails')
  const body = await readBody<{
    eventId?: number
    locale?: 'fr' | 'en'
    selectedUserIds?: number[]
    manualEmails?: string[]
    subject?: string
    body?: string
    extraMessage?: string
  }>(event)

  const eventId = Number(body.eventId)
  if (!Number.isInteger(eventId) || eventId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Événement invalide' })
  }

  const eventRow = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      audienceRoles: {
        include: { role: true }
      }
    }
  })
  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  const sent = await sendParticipationCall({
    eventRow,
    locale: body.locale === 'en' ? 'en' : 'fr',
    selectedUserIds: Array.isArray(body.selectedUserIds) ? body.selectedUserIds.map(Number).filter(id => Number.isInteger(id) && id > 0) : [],
    manualEmails: Array.isArray(body.manualEmails) ? body.manualEmails : [],
    subject: body.subject,
    body: body.body,
    extraMessage: body.extraMessage
  })

  const eligibleUsers = await listAudienceEligibleUsers(eventRow)
  return {
    sent,
    eligibleUsers
  }
})
