import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'delete')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }

  const existing = await prisma.memberRole.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Rôle associatif introuvable' })
  }

  await prisma.memberRole.delete({
    where: { id }
  })

  return { ok: true }
})
