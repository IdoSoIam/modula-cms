import { db } from '#modula/server/data/client'
import { buildRentalReturnPreview, resolveRentalReturnStatus, serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'
import { sendRentalLateFeeNotification, sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'
import { requirePermission } from '#modula/server/utils/permissions'
import type { RentalReturnDecision } from '#modula/shared/rentalLateFees'

interface Body {
  actualReturnAt?: string
  decision?: RentalReturnDecision
  waiverReason?: string | null
  preview?: boolean
}

export default defineEventHandler(async (event) => {
  const sessionUser = await requirePermission(event, 'shop_orders', 'update')
  const lineId = Number(getRouterParam(event, 'lineId'))
  if (!Number.isInteger(lineId) || lineId <= 0) throw createError({ statusCode: 400, message: 'Ligne de location invalide' })

  const body = await readBody<Body>(event)
  const decision: RentalReturnDecision = ['APPLY', 'WAIVE'].includes(String(body.decision)) ? body.decision! : 'PENDING'
  const waiverReason = String(body.waiverReason || '').trim() || null
  const preview = await buildRentalReturnPreview(lineId, body.actualReturnAt || new Date())
  const resolved = resolveRentalReturnStatus({
    lateMinutes: preview.calculation.lateMinutes,
    feeEnabled: preview.enabled,
    decision,
    waiverReason,
  })

  const payload = {
    orderId: Number(preview.line.orderId),
    orderLineId: Number(preview.line.id),
    productId: preview.line.productId == null ? null : Number(preview.line.productId),
    scheduledReturnAt: preview.scheduledReturnAt,
    actualReturnAt: preview.actualReturnAt,
    status: resolved.status,
    lateMinutes: preview.calculation.lateMinutes,
    graceMinutes: preview.config.graceMinutes,
    calculationMode: preview.enabled ? preview.mode : null,
    configuredAmount: preview.config.configuredAmount,
    baseRate: preview.calculation.baseRate,
    multiplier: preview.config.multiplier,
    minimumAmount: preview.config.minimumAmount,
    maximumAmount: preview.config.maximumAmount,
    quantity: Number(preview.line.quantity || 1),
    subtotalExclTax: preview.enabled ? preview.calculation.subtotalExclTax : 0,
    vatRate: preview.calculation.vatRate,
    vatAmount: preview.enabled ? preview.calculation.vatAmount : 0,
    totalInclTax: preview.enabled ? preview.calculation.totalInclTax : 0,
    waiverReason: resolved.waiverReason,
    paymentStatus: resolved.status === 'LATE_FEE_DUE' ? 'UNPAID' : 'CANCELLED',
    paidAt: null,
    actorUserId: sessionUser.id,
  }
  if (body.preview) return { ...serializeRentalReturn(payload), feeEnabled: preview.enabled }

  const existing = await db.rentalReturn.findUnique({ where: { orderLineId: lineId } })
  if (existing) return serializeRentalReturn(existing)
  const created = await db.rentalReturn.create({ data: payload })

  const orderId = Number(preview.line.orderId)
  const rentalLines = await db.shopOrderLine.findMany({ where: { orderId, rentalEndDate: { not: null } } })
  const returns = await db.rentalReturn.findMany({ where: { orderId } })
  const order = preview.line.order
  if (rentalLines.length > 0 && returns.length >= rentalLines.length && !['DRAFT', 'PENDING', 'COMPLETED', 'CANCELLED'].includes(String(order.status))) {
    await db.shopOrder.update({ where: { id: orderId }, data: { status: 'COMPLETED' } })
    await sendShopOrderTransitionNotifications(orderId, {
      previousStatus: order.status,
      previousPaymentStatus: order.paymentStatus,
      previousAfterSalesStatus: order.afterSalesStatus,
      previousPaymentFailureReason: order.paymentFailureReason,
    })
  }
  if (resolved.status === 'LATE_FEE_DUE' || (preview.enabled && resolved.status === 'LATE_FEE_WAIVED')) {
    await sendRentalLateFeeNotification(orderId, resolved.status, serializeRentalReturn(created)!)
  }
  return serializeRentalReturn(created)
})
