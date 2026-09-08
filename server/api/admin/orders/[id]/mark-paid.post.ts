import { db } from '#modula/server/data/client'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'
import { serializeShopOrder } from '#modula/server/utils/shop'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid order id' })
  }

  const existing = await db.shopOrder.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }
  if (existing.paymentProvider !== 'OFFLINE') {
    throw createError({ statusCode: 409, statusMessage: 'Only offline payments can be marked as paid manually' })
  }
  if (existing.paymentStatus === 'REFUNDED') {
    throw createError({ statusCode: 409, statusMessage: 'A refunded order cannot be marked as paid' })
  }
  if (existing.status === 'CANCELLED') {
    throw createError({ statusCode: 409, statusMessage: 'A cancelled order cannot be marked as paid' })
  }
  if (existing.paymentStatus === 'PAID') {
    const order = await db.shopOrder.findUnique({
      where: { id },
      include: { lines: true, pickupPoint: true, deliveryTour: true },
    })
    return serializeShopOrder(order)
  }

  const updated = await db.shopOrder.update({
    where: { id },
    data: {
      paymentStatus: 'PAID',
      providerPaymentStatus: 'paid_offline',
      paymentFailureReason: null,
      paidAt: new Date(),
      checkoutUrl: null,
    },
    include: { lines: true, pickupPoint: true, deliveryTour: true },
  })

  await sendShopOrderTransitionNotifications(id, {
    previousStatus: existing.status,
    previousPaymentStatus: existing.paymentStatus,
    previousPaymentFailureReason: existing.paymentFailureReason,
    previousAfterSalesStatus: existing.afterSalesStatus ?? 'NONE',
  })

  return serializeShopOrder(updated)
})
