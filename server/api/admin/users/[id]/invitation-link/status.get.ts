import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant utilisateur invalide' })
  }

  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, isActive: true }
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
  }

  const activeToken = await db.passwordSetupToken.findFirst({
    where: { userId: id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    select: { expiresAt: true, createdAt: true }
  })

  return {
    active: !!activeToken,
    expiresAt: activeToken?.expiresAt.toISOString() ?? null,
    createdAt: activeToken?.createdAt.toISOString() ?? null
  }
})
