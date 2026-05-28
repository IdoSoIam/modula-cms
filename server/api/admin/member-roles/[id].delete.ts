import { prisma } from '#modula/prisma/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { requireAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAssociationRolesEnabled()
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
