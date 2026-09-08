import { db } from '#modula/server/data/client'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'
import { serializeShopOrder } from '#modula/server/utils/shop'
import { requirePermission } from '#modula/server/utils/permissions'

const ORDER_STATUSES = new Set(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED'])
const ORDER_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING'],
  PENDING: ['CONFIRMED'],
  CONFIRMED: ['PENDING', 'IN_PREPARATION', 'READY', 'COMPLETED'],
  IN_PREPARATION: ['READY', 'IN_DELIVERY', 'COMPLETED'],
  READY: ['IN_DELIVERY', 'COMPLETED'],
  IN_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}
export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
    })
  }

  const body = await readBody<{ status?: string }>(event)

  const status = typeof body?.status === 'string' ? body.status.trim().toUpperCase() : ''

  if (!ORDER_STATUSES.has(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order status',
    })
  }

  const existing = await db.shopOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentFailureReason: true,
      afterSalesStatus: true,
      paidAt: true,
      refundedAt: true,
      cancelledAt: true,
    },
  })

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    })
  }

  const previousStatus = existing.status
  const previousPaymentStatus = existing.paymentStatus
  const previousPaymentFailureReason = existing.paymentFailureReason
  const previousAfterSalesStatus = existing.afterSalesStatus ?? 'NONE'

  const data: Record<string, any> = {
    status,
  }
  if (status !== existing.status && !ORDER_TRANSITIONS[String(existing.status)]?.includes(status)) {
    throw createError({ statusCode: 409, statusMessage: 'Invalid order status transition' })
  }

  if (status === 'CANCELLED') {
    data.cancelledAt = existing.cancelledAt || new Date()
    data.checkoutUrl = null
  } else {
    data.cancelledAt = null
  }

  const updated = await db.shopOrder.update({
    where: { id },
    data,
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  await sendShopOrderTransitionNotifications(id, {
    previousStatus,
    previousPaymentStatus,
    previousPaymentFailureReason,
    previousAfterSalesStatus,
  })

  return serializeShopOrder(updated)
})
