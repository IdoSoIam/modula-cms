import { verifyStripeWebhook } from '#modula/server/services/payment/paymentService'
import { syncShopOrderFromStripeEvent } from '#modula/server/services/payment/shopOrderStripeSync'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'

export default defineEventHandler(async (event) => {
  const signature = getHeader(event, 'stripe-signature')
  if (!signature) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing signature',
      message: 'L’en-tête Stripe-Signature est requis.'
    })
  }

  const rawBody = await readRawBody(event, 'utf8')
  if (!rawBody) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing body',
      message: 'Le corps brut du webhook Stripe est requis.'
    })
  }

  const stripeEvent = await verifyStripeWebhook(rawBody, signature)
  const syncedOrder = await syncShopOrderFromStripeEvent(stripeEvent)

  if (syncedOrder?.changed) {
    await sendShopOrderTransitionNotifications(syncedOrder.id, {
      previousStatus: syncedOrder.previousStatus,
      previousPaymentStatus: syncedOrder.previousPaymentStatus,
      previousPaymentFailureReason: syncedOrder.previousPaymentFailureReason
    })
  }

  return {
    received: true,
    type: stripeEvent.type,
    objectId: 'id' in stripeEvent.data.object ? String((stripeEvent.data.object as { id?: string }).id || '') : '',
    orderId: syncedOrder?.id ?? null,
    orderNumber: syncedOrder?.orderNumber ?? null,
    orderStatus: syncedOrder?.status ?? null,
    paymentStatus: syncedOrder?.paymentStatus ?? null,
  }
})
