import { db } from '#modula/server/data/client'
import { sendRentalLateFeeNotification } from '#modula/server/services/shop/shopOrderEmails'
import { serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')
  const lineId = Number(getRouterParam(event, 'lineId'))
  const body = await readBody<{ reason?: string | null }>(event)
  const reason = String(body.reason || '').trim()
  if (!reason) throw createError({ statusCode: 400, message: 'Un motif est obligatoire pour abandonner les frais' })
  const current = await db.rentalReturn.findUnique({ where: { orderLineId: lineId } })
  if (!current) throw createError({ statusCode: 404, message: 'Restitution introuvable' })
  if (current.status === 'LATE_FEE_WAIVED') return serializeRentalReturn(current)
  if (!['RETURNED_LATE_PENDING', 'LATE_FEE_DUE'].includes(String(current.status))) {
    throw createError({ statusCode: 409, message: 'Ces frais de retard ne peuvent plus être abandonnés' })
  }
  const updated = await db.rentalReturn.update({
    where: { id: current.id },
    data: {
      status: 'LATE_FEE_WAIVED', paymentStatus: 'CANCELLED', waiverReason: reason,
    },
  })
  await sendRentalLateFeeNotification(Number(current.orderId), 'LATE_FEE_WAIVED', serializeRentalReturn(updated)!)
  return serializeRentalReturn(updated)
})
