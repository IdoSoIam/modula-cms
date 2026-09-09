import { db } from '#modula/server/data/client'
import { sendRentalLateFeeNotification } from '#modula/server/services/shop/shopOrderEmails'
import { serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')
  const lineId = Number(getRouterParam(event, 'lineId'))
  const current = await db.rentalReturn.findUnique({ where: { orderLineId: lineId } })
  if (!current) throw createError({ statusCode: 404, message: 'Restitution introuvable' })
  if (current.status === 'LATE_FEE_PAID') return serializeRentalReturn(current)
  if (current.status !== 'LATE_FEE_DUE') throw createError({ statusCode: 409, message: 'Aucun frais de retard à régler pour cette location' })

  const updated = await db.rentalReturn.update({
    where: { id: current.id },
    data: { status: 'LATE_FEE_PAID', paymentStatus: 'PAID', paidAt: new Date() },
  })
  await sendRentalLateFeeNotification(Number(current.orderId), 'LATE_FEE_PAID', serializeRentalReturn(updated)!)
  return serializeRentalReturn(updated)
})
