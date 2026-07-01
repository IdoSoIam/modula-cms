import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const sessionUser = await requirePermission(event, 'users', 'update')
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant utilisateur invalide' })
  }

  if (sessionUser.id === id) {
    throw createError({ statusCode: 400, statusMessage: 'Vous ne pouvez pas supprimer votre propre compte' })
  }

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      role: true,
      managedRole: {
        select: {
          slug: true
        }
      }
    }
  })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Utilisateur introuvable' })
  }

  const isTargetAdmin = user.role === 'admin' || user.managedRole?.slug === 'admin' || user.managedRole?.slug === 'super_admin'

  if (isTargetAdmin) {
    const remainingAdmins = await db.user.count({
      where: {
        id: { not: id },
        OR: [
          { role: 'admin' },
          { managedRole: { is: { slug: { in: ['admin', 'super_admin'] } } } }
        ]
      }
    })

    if (remainingAdmins === 0) {
      throw createError({ statusCode: 403, statusMessage: 'Impossible de supprimer le dernier administrateur' })
    }
  }

  const [shopOrdersCount, publishedArticlesCount] = await Promise.all([
    db.shopOrder.count({
      where: {
        userId: id,
        status: { in: ['PENDING', 'PAID'] }
      }
    }),
    db.article.count({
      where: {
        authorId: id,
        published: true
      }
    })
  ])

  const activeDependencies: string[] = []
  if (shopOrdersCount > 0) {
    activeDependencies.push(`${shopOrdersCount} commande(s) active(s)`)
  }
  if (publishedArticlesCount > 0) {
    activeDependencies.push(`${publishedArticlesCount} article(s) publie(s)`)
  }

  if (activeDependencies.length > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: `Suppression impossible: dependances actives (${activeDependencies.join(', ')})`
    })
  }

  await db.user.delete({ where: { id } })

  return { ok: true }
})
