import { db } from '#modula/server/data/client'
import { sendRentalLateFeeNotification } from '#modula/server/services/shop/shopOrderEmails'
import { serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')
  const lineId = Number(getRouterParam(event, 'lineId'))
  const body = await readBody<{ apply?: boolean, reason?: string | null }>(event)
  const current = await db.rentalReturn.findUnique({ where: { orderLineId: lineId } })
  if (!current) throw createError({ statusCode: 404, message: 'Restitution introuvable' })
  if (current.status !== 'RETURNED_LATE_PENDING') return serializeRentalReturn(current)
  const reason = String(body.reason || '').trim() || null
  if (!body.apply && !reason) throw createError({ statusCode: 400, message: 'Un motif est obligatoire pour abandonner les frais' })

  const status = body.apply ? 'LATE_FEE_DUE' : 'LATE_FEE_WAIVED'
  const updated = await db.rentalReturn.update({
    where: { id: current.id },
    data: {
      status,
      paymentStatus: body.apply ? 'UNPAID' : 'CANCELLED',
      waiverReason: body.apply ? null : reason,
    },
  })
  await sendRentalLateFeeNotification(Number(current.orderId), status, serializeRentalReturn(updated)!)
  return serializeRentalReturn(updated)
})
