import { requireAdmin } from '~/server/utils/requireAdmin'
import { syncImageUsageTable } from '~/server/utils/imageReferences'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const reservations = await prisma.reservation.count({ where: { basketId: id } })
  if (reservations > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Ce panier a ${reservations} réservation(s). Désactivez-le plutôt que de le supprimer.`
    })
  }
  await prisma.basket.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
