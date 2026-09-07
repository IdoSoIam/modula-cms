import { db } from '#modula/server/data/client'
import { listAudienceEligibleUsers, sendParticipationCall } from '#modula/server/utils/events'
import { requireSpecialPermission } from '#modula/server/utils/permissions'
import { resolveEventEmailLocale } from '#modula/server/services/events/notifications'

export default defineEventHandler(async (event) => {
  await requireSpecialPermission(event, 'send_event_participation_emails')
  const body = await readBody<{
    eventId?: number
    locale?: string
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

  const eventRow = await db.event.findUnique({
    where: { id: eventId },
    include: {
      audienceMemberRoles: {
        include: { memberRole: true }
      }
    }
  })
  if (!eventRow) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  const sent = await sendParticipationCall({
    eventRow,
    locale: await resolveEventEmailLocale(body.locale),
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
