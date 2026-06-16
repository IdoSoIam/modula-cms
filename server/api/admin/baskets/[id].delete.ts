import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const reservations = await db.reservation.count({ where: { basketId: id } })
  if (reservations > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Ce panier a ${reservations} réservation(s). Désactivez-le plutôt que de le supprimer.`
    })
  }
  await db.basket.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
