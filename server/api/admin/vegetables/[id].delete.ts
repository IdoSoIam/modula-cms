import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const used = await prisma.basketItem.count({ where: { vegetableId: id } })
  if (used > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Ce légume est utilisé dans ${used} panier(s). Retirez-le des paniers d'abord.`
    })
  }
  await prisma.vegetable.delete({ where: { id } })
  return { ok: true }
})
