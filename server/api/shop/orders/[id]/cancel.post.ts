import { db } from '#modula/server/data/client'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
      message: "L'identifiant de commande est invalide.",
    })
  }

  const order = await db.shopOrder.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentFailureReason: true,
    },
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  if (order.status === 'CANCELLED' || order.paymentStatus === 'PAID') {
    return { id: order.id, status: order.status, paymentStatus: order.paymentStatus, alreadyCancelled: true }
  }

  const previousStatus = order.status
  const previousPaymentStatus = order.paymentStatus
  const previousPaymentFailureReason = order.paymentFailureReason

  const updated = await db.shopOrder.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'FAILED',
      paymentFailureReason: 'Paiement annulé par l\'utilisateur sur Stripe.',
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
    },
  })

  await sendShopOrderTransitionNotifications(id, {
    previousStatus,
    previousPaymentStatus,
    previousPaymentFailureReason,
  })

  return updated
})
