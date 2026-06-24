import type { CmsRegistryPaymentRecord } from '#modula/shared/registry'
import { db } from '#modula/server/data/client'

type ShopOrderStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
type ShopPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

interface SyncedOrderResult {
  id: number
  orderNumber: string
  status: ShopOrderStatus
  paymentStatus: ShopPaymentStatus
  previousStatus: ShopOrderStatus | null
  previousPaymentStatus: ShopPaymentStatus | null
  previousPaymentFailureReason: string | null
  changed: boolean
}

export async function syncShopOrderFromRegistryPayment(
  payment: CmsRegistryPaymentRecord,
): Promise<SyncedOrderResult | null> {
  const orderId = Number(payment.orderId)
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return null
  }

  const order = await db.shopOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
      paymentFailureReason: true,
    },
  })
  if (!order) return null

  const data: Record<string, any> = {
    providerSessionId: payment.providerSessionId || null,
    providerPaymentIntentId: payment.providerPaymentIntentId || null,
    providerPaymentStatus: payment.providerPaymentStatus || null,
    providerLastEventId: payment.lastEventId || null,
    paymentFailureReason: payment.failureReason || null,
    checkoutUrl: payment.checkoutUrl || null,
    paymentStatus: payment.paymentStatus,
  }

  if (payment.paymentStatus === 'PAID' && order.status !== 'CANCELLED') {
    data.status = 'PAID'
    data.paidAt = new Date()
  } else if (payment.paymentStatus === 'FAILED') {
    data.status = order.status === 'CANCELLED' ? 'CANCELLED' : 'PENDING'
  } else if (payment.paymentStatus === 'REFUNDED') {
    data.refundedAt = new Date()
  }

  const previousStatus = order.status as ShopOrderStatus
  const previousPaymentStatus = order.paymentStatus as ShopPaymentStatus
  const previousPaymentFailureReason = order.paymentFailureReason ?? null
  const nextStatus = (data.status ?? order.status) as ShopOrderStatus
  const nextPaymentStatus = (data.paymentStatus ?? order.paymentStatus) as ShopPaymentStatus
  const nextPaymentFailureReason =
    data.paymentFailureReason !== undefined
      ? (data.paymentFailureReason as string | null)
      : previousPaymentFailureReason
  const changed =
    previousStatus !== nextStatus
    || previousPaymentStatus !== nextPaymentStatus
    || previousPaymentFailureReason !== nextPaymentFailureReason

  const updated = await db.shopOrder.update({
    where: { id: order.id },
    data,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentStatus: true,
    },
  })

  return updated
    ? {
        ...updated,
        previousStatus,
        previousPaymentStatus,
        previousPaymentFailureReason,
        changed,
      }
    : null
}
