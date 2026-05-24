import { prisma } from '~/prisma/client'
import { eventToPayload } from '~/server/utils/events'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant événement invalide' })
  }

  const item = await prisma.event.findUnique({
    where: { id },
    include: {
      audienceMemberRoles: {
        include: { memberRole: true }
      }
    }
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }

  return eventToPayload(item)
})
