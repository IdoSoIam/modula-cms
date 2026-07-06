import type { CmsRegistryPaymentRecord } from '#modula/shared/registry'
import { db } from '#modula/server/data/client'
import { computeShopOrderCustomerActionState, serializeShopOrder } from '#modula/server/utils/shop'
import {
  cancelRegistryPaymentByOrder,
  refundRegistryPaymentByOrder,
} from '#modula/server/utils/cmsRegistry'
import {
  sendShopOrderRefundRejectedNotifications,
  sendShopOrderRefundRequestNotifications,
  sendShopOrderTransitionNotifications,
} from '#modula/server/services/shop/shopOrderEmails'

type OrderRow = any

function parseLineMeta(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

async function getOrderForMutation(id: number) {
  return await db.shopOrder.findUnique({
    where: { id },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })
}

function buildPaymentSyncData(payment: CmsRegistryPaymentRecord) {
  const data: Record<string, any> = {
    providerSessionId: payment.providerSessionId || null,
    providerPaymentIntentId: payment.providerPaymentIntentId || null,
    providerPaymentStatus: payment.providerPaymentStatus || null,
    providerLastEventId: payment.lastEventId || null,
    paymentFailureReason: payment.failureReason || null,
    paymentStatus: payment.paymentStatus,
    checkoutUrl: payment.checkoutUrl || null,
  }

  if (payment.paymentStatus === 'PAID') {
    data.paidAt = new Date()
  }

  if (payment.paymentStatus === 'REFUNDED') {
    data.refundedAt = new Date()
  }

  return data
}

function buildTransition(order: OrderRow) {
  return {
    previousStatus: order.status,
    previousPaymentStatus: order.paymentStatus,
    previousPaymentFailureReason: order.paymentFailureReason ?? null,
    previousAfterSalesStatus: order.afterSalesStatus ?? 'NONE',
  }
}

export async function cancelShopOrder(orderId: number) {
  const order = await getOrderForMutation(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  if (order.status === 'CANCELLED') {
    return serializeShopOrder(order)
  }

  if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Order already paid',
      message: 'Cette commande payée doit être remboursée plutôt qu’annulée directement.',
    })
  }

  const transition = buildTransition(order)
  let data: Record<string, any> = {
    status: 'CANCELLED',
    cancelledAt: order.cancelledAt || new Date(),
    checkoutUrl: null,
    afterSalesStatus: 'NONE',
    refundRequestReason: null,
    refundRequestNote: null,
    refundRequestedAt: null,
    refundReviewedAt: new Date(),
  }

  if (order.paymentProvider === 'STRIPE') {
    const payment = await cancelRegistryPaymentByOrder(String(order.id))
    data = {
      ...data,
      ...buildPaymentSyncData(payment),
      paymentStatus: payment.paymentStatus === 'UNPAID' ? 'FAILED' : payment.paymentStatus,
      paymentFailureReason: payment.failureReason || 'Paiement annulé.',
    }
  } else if (order.paymentStatus !== 'FAILED') {
    data.paymentStatus = order.paymentStatus === 'UNPAID' ? 'UNPAID' : 'FAILED'
  }

  const updated = await db.shopOrder.update({
    where: { id: order.id },
    data,
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  await sendShopOrderTransitionNotifications(order.id, transition)
  return serializeShopOrder(updated)
}

export async function cancelShopOrderCheckout(orderId: number) {
  const order = await getOrderForMutation(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  if (order.paymentStatus === 'PAID') {
    return serializeShopOrder(order)
  }

  const transition = buildTransition(order)
  let data: Record<string, any> = {
    status: order.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
    paymentStatus: 'FAILED',
    paymentFailureReason: 'Paiement annulé par l’utilisateur sur Stripe.',
    checkoutUrl: null,
    providerPaymentStatus: 'canceled',
    afterSalesStatus: 'NONE',
  }

  if (order.paymentProvider === 'STRIPE') {
    const payment = await cancelRegistryPaymentByOrder(String(order.id))
    data = {
      ...data,
      ...buildPaymentSyncData(payment),
      status: order.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING',
      paymentStatus: 'FAILED',
      paymentFailureReason: payment.failureReason || 'Paiement annulé par l’utilisateur sur Stripe.',
      checkoutUrl: null,
      providerPaymentStatus: payment.providerPaymentStatus || 'canceled',
    }
  }

  const updated = await db.shopOrder.update({
    where: { id: order.id },
    data,
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  await sendShopOrderTransitionNotifications(order.id, transition)
  return serializeShopOrder(updated)
}

export async function refundShopOrder(orderId: number) {
  const order = await getOrderForMutation(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  if (order.paymentStatus === 'REFUNDED') {
    return serializeShopOrder(order)
  }

  if (order.paymentStatus !== 'PAID') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Order is not paid',
      message: 'Seules les commandes payées peuvent être remboursées.',
    })
  }

  const transition = buildTransition(order)
  let data: Record<string, any> = {
    status: 'CANCELLED',
    cancelledAt: order.cancelledAt || new Date(),
    refundedAt: order.refundedAt || new Date(),
    paymentStatus: 'REFUNDED',
    providerPaymentStatus: 'refunded',
    checkoutUrl: null,
    paymentFailureReason: null,
    afterSalesStatus: 'NONE',
    refundReviewedAt: new Date(),
  }

  if (order.paymentProvider === 'STRIPE') {
    const payment = await refundRegistryPaymentByOrder(String(order.id))
    data = {
      ...data,
      ...buildPaymentSyncData(payment),
      status: 'CANCELLED',
      cancelledAt: order.cancelledAt || new Date(),
      refundedAt: order.refundedAt || new Date(),
      paymentStatus: 'REFUNDED',
      providerPaymentStatus: payment.providerPaymentStatus || 'refunded',
      paymentFailureReason: null,
      checkoutUrl: null,
    }
  }

  const updated = await db.shopOrder.update({
    where: { id: order.id },
    data,
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  await sendShopOrderTransitionNotifications(order.id, transition)
  return serializeShopOrder(updated)
}

export async function requestShopOrderRefund(orderId: number, reason: string | null | undefined) {
  const order = await getOrderForMutation(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  const actionState = computeShopOrderCustomerActionState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    afterSalesStatus: order.afterSalesStatus,
    deliveryType: order.deliveryType,
      fulfillmentDate: order.fulfillmentDate ? new Date(order.fulfillmentDate).toISOString() : null,
      fulfillmentTime: order.fulfillmentTime ?? null,
      lines: Array.isArray(order.lines)
        ? order.lines.map((line: any) => ({
          meta: parseLineMeta(line.metaJson)
        }))
      : []
  })

  if (actionState.kind !== 'REQUEST_REFUND') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Refund request unavailable',
      message: 'Cette commande ne peut pas faire l’objet d’une demande de remboursement.',
    })
  }

  const transition = buildTransition(order)
  const updated = await db.shopOrder.update({
    where: { id: order.id },
    data: {
      afterSalesStatus: 'REFUND_REQUESTED',
      refundRequestReason: String(reason || '').trim() || null,
      refundRequestNote: null,
      refundRequestedAt: order.refundRequestedAt || new Date(),
      refundReviewedAt: null,
    },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  await sendShopOrderTransitionNotifications(order.id, transition)
  await sendShopOrderRefundRequestNotifications(updated.id)
  return serializeShopOrder(updated)
}

export async function rejectShopOrderRefundRequest(orderId: number, note: string | null | undefined) {
  const order = await getOrderForMutation(orderId)
  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  if (order.afterSalesStatus !== 'REFUND_REQUESTED') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Refund request not pending',
      message: 'Aucune demande de remboursement en attente pour cette commande.',
    })
  }

  const transition = buildTransition(order)
  const updated = await db.shopOrder.update({
    where: { id: order.id },
    data: {
      afterSalesStatus: 'REFUND_REJECTED',
      refundRequestNote: String(note || '').trim() || null,
      refundReviewedAt: new Date(),
    },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  await sendShopOrderTransitionNotifications(order.id, transition)
  await sendShopOrderRefundRejectedNotifications(updated.id)
  return serializeShopOrder(updated)
}
