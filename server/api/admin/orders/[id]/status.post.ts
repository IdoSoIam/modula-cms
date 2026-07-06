import { db } from '#modula/server/data/client'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'
import { serializeShopOrder } from '#modula/server/utils/shop'
import { requirePermission } from '#modula/server/utils/permissions'

const ORDER_STATUSES = new Set(['DRAFT', 'PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED'])
const PAYMENT_STATUSES = new Set(['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'])

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
    })
  }

  const body = await readBody<{
    status?: string
    paymentStatus?: string
  }>(event)

  const status = typeof body?.status === 'string' ? body.status.trim().toUpperCase() : ''
  const paymentStatus = typeof body?.paymentStatus === 'string' ? body.paymentStatus.trim().toUpperCase() : ''

  if (!ORDER_STATUSES.has(status)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order status',
    })
  }

  if (!PAYMENT_STATUSES.has(paymentStatus)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payment status',
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
    paymentStatus,
    paymentFailureReason: paymentStatus === 'FAILED' ? existing.paymentFailureReason || 'Paiement marqué comme échoué depuis l’administration.' : null,
  }

  const providerPaymentStatusMap: Record<string, string | null> = {
    UNPAID: 'unpaid',
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  }
  data.providerPaymentStatus = providerPaymentStatusMap[paymentStatus] ?? existing.paymentStatus ?? null

  if (paymentStatus === 'PAID') {
    data.paidAt = existing.paidAt || new Date()
    data.checkoutUrl = null
  }

  if (paymentStatus === 'REFUNDED') {
    data.refundedAt = existing.refundedAt || new Date()
    data.checkoutUrl = null
    data.afterSalesStatus = 'NONE'
    data.refundReviewedAt = new Date()
  } else if (status !== 'CANCELLED') {
    data.refundedAt = null
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
