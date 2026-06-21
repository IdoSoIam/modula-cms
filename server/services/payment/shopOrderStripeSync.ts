import Stripe from 'stripe'
import { db } from '#modula/server/data/client'

type ShopOrderStatus = 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
type ShopPaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

interface StripeSyncPayload {
  eventId: string
  checkoutSessionId?: string | null
  paymentIntentId?: string | null
  paymentIntentStatus?: string | null
  paymentStatus?: ShopPaymentStatus
  orderStatus?: ShopOrderStatus
  paidAt?: Date | null
  refundedAt?: Date | null
  paymentFailureReason?: string | null
  metadataOrderId?: number | null
}

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

export async function syncShopOrderFromCheckoutSession(
  session: Stripe.Checkout.Session,
  eventId = `manual_checkout_session_${session.id}`,
): Promise<SyncedOrderResult | null> {
  const metadataOrderId = normalizeMetadataOrderId(session.metadata?.orderId)
  const checkoutSessionId = session.id || null
  const paymentIntentId = normalizeExpandableId(session.payment_intent)

  if (session.status === 'expired') {
    return await syncShopOrderFromStripePayload({
      eventId,
      checkoutSessionId,
      paymentIntentId,
      paymentIntentStatus: null,
      paymentStatus: 'FAILED',
      paymentFailureReason: 'checkout_session_expired',
      metadataOrderId,
    })
  }

  if (session.payment_status === 'unpaid') {
    return await syncShopOrderFromStripePayload({
      eventId,
      checkoutSessionId,
      paymentIntentId,
      paymentIntentStatus: null,
      paymentStatus: 'PENDING',
      metadataOrderId,
    })
  }

  return await syncShopOrderFromStripePayload({
    eventId,
    checkoutSessionId,
    paymentIntentId,
    paymentIntentStatus: null,
    paymentStatus: session.payment_status === 'paid' ? 'PAID' : 'PENDING',
    paidAt: session.payment_status === 'paid' ? new Date() : null,
    metadataOrderId,
  })
}

export async function syncShopOrderFromStripePayload(
  payload: StripeSyncPayload,
): Promise<SyncedOrderResult | null> {
  const order = await findStripeOrder(payload)
  if (!order) {
    return null
  }

  const data: Record<string, any> = {
    stripeLastEventId: payload.eventId,
  }

  if (payload.checkoutSessionId) {
    data.stripeCheckoutSessionId = payload.checkoutSessionId
  }
  if (payload.paymentIntentId) {
    data.stripePaymentIntentId = payload.paymentIntentId
  }
  if (payload.paymentIntentStatus !== undefined) {
    data.stripePaymentIntentStatus = payload.paymentIntentStatus || null
  }
  if (payload.paymentStatus) {
    data.paymentStatus = payload.paymentStatus
  }
  if (payload.paymentFailureReason !== undefined) {
    data.paymentFailureReason = payload.paymentFailureReason || null
  }
  if (payload.paidAt) {
    data.paidAt = payload.paidAt
  }
  if (payload.refundedAt) {
    data.refundedAt = payload.refundedAt
  }

  if (payload.orderStatus) {
    data.status = payload.orderStatus
  } else if (payload.paymentStatus === 'PAID' && order.status !== 'CANCELLED') {
    data.status = 'PAID'
  }

  const previousStatus = order.status as ShopOrderStatus
  const previousPaymentStatus = order.paymentStatus as ShopPaymentStatus
  const previousPaymentFailureReason = (order as { paymentFailureReason?: string | null }).paymentFailureReason ?? null
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

export async function syncShopOrderFromStripeEvent(
  stripeEvent: Stripe.Event,
): Promise<SyncedOrderResult | null> {
  switch (stripeEvent.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
    case 'checkout.session.async_payment_failed':
    case 'checkout.session.expired':
      return await syncCheckoutSessionEvent(stripeEvent)
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled':
      return await syncPaymentIntentEvent(stripeEvent)
    case 'charge.refunded':
      return await syncChargeRefundedEvent(stripeEvent)
    default:
      return null
  }
}

async function findStripeOrder(payload: StripeSyncPayload) {
  if (payload.checkoutSessionId) {
    const bySession = await db.shopOrder.findFirst({
      where: { stripeCheckoutSessionId: payload.checkoutSessionId },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentFailureReason: true },
    })
    if (bySession) {
      return bySession
    }
  }

  if (payload.paymentIntentId) {
    const byIntent = await db.shopOrder.findFirst({
      where: { stripePaymentIntentId: payload.paymentIntentId },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentFailureReason: true },
    })
    if (byIntent) {
      return byIntent
    }
  }

  if (payload.metadataOrderId) {
    return await db.shopOrder.findFirst({
      where: { id: payload.metadataOrderId },
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentFailureReason: true },
    })
  }

  return null
}

async function syncCheckoutSessionEvent(
  stripeEvent: Stripe.Event,
): Promise<SyncedOrderResult | null> {
  const session = stripeEvent.data.object as Stripe.Checkout.Session
  if (stripeEvent.type === 'checkout.session.async_payment_failed') {
    const metadataOrderId = normalizeMetadataOrderId(session.metadata?.orderId)
    const checkoutSessionId = session.id || null
    const paymentIntentId = normalizeExpandableId(session.payment_intent)
    return await syncShopOrderFromStripePayload({
      eventId: stripeEvent.id,
      checkoutSessionId,
      paymentIntentId,
      paymentIntentStatus: null,
      paymentStatus: 'FAILED',
      paymentFailureReason: 'async_payment_failed',
      metadataOrderId,
    })
  }
  return await syncShopOrderFromCheckoutSession(session, stripeEvent.id)
}

async function syncPaymentIntentEvent(
  stripeEvent: Stripe.Event,
): Promise<SyncedOrderResult | null> {
  const paymentIntent = stripeEvent.data.object as Stripe.PaymentIntent
  const metadataOrderId = normalizeMetadataOrderId(paymentIntent.metadata?.orderId)
  const paymentIntentId = paymentIntent.id || null
  const paymentIntentStatus = paymentIntent.status || null

  if (stripeEvent.type === 'payment_intent.succeeded') {
    return await syncShopOrderFromStripePayload({
      eventId: stripeEvent.id,
      paymentIntentId,
      paymentIntentStatus,
      paymentStatus: 'PAID',
      paidAt: new Date(),
      metadataOrderId,
    })
  }

  const paymentFailureReason = paymentIntent.last_payment_error?.message
    || (stripeEvent.type === 'payment_intent.canceled' ? 'payment_intent_canceled' : null)

  return await syncShopOrderFromStripePayload({
    eventId: stripeEvent.id,
    paymentIntentId,
    paymentIntentStatus,
    paymentStatus: 'FAILED',
    paymentFailureReason,
    metadataOrderId,
  })
}

async function syncChargeRefundedEvent(
  stripeEvent: Stripe.Event,
): Promise<SyncedOrderResult | null> {
  const charge = stripeEvent.data.object as Stripe.Charge
  const paymentIntentId = normalizeExpandableId(charge.payment_intent)
  const metadataOrderId = normalizeMetadataOrderId(charge.metadata?.orderId)

  return await syncShopOrderFromStripePayload({
    eventId: stripeEvent.id,
    paymentIntentId,
    paymentStatus: 'REFUNDED',
    refundedAt: new Date(),
    paymentFailureReason: null,
    metadataOrderId,
  })
}

function normalizeExpandableId(
  value: string | Stripe.PaymentIntent | Stripe.DeletedPaymentIntent | null,
) {
  if (!value) return null
  if (typeof value === 'string') return value
  return 'id' in value && typeof value.id === 'string' ? value.id : null
}

function normalizeMetadataOrderId(value: string | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}
