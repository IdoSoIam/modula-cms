import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { id: true, firstName: true, lastName: true, email: true } } }
  })
  if (!article) throw createError({ statusCode: 404, statusMessage: 'Article introuvable' })
  return article
})
