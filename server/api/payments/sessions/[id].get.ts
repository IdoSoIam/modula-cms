import {
  retrieveStripeCheckoutSession,
  retrieveRegistryPaymentRecord,
} from '#modula/server/services/payment/paymentService'
import { syncShopOrderFromRegistryPayment } from '#modula/server/services/payment/shopOrderStripeSync'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing session id',
      message: 'L’identifiant de session Stripe est requis.'
    })
  }

  const session = await retrieveStripeCheckoutSession(id)
  let syncedOrder = null

  if (getQuery(event).sync !== '0') {
    const payment = await retrieveRegistryPaymentRecord(id)
    syncedOrder = await syncShopOrderFromRegistryPayment(payment)
    if (syncedOrder?.changed) {
      await sendShopOrderTransitionNotifications(syncedOrder.id, {
        previousStatus: syncedOrder.previousStatus,
        previousPaymentStatus: syncedOrder.previousPaymentStatus,
        previousPaymentFailureReason: syncedOrder.previousPaymentFailureReason
      })
    }
  }

  return {
    ...session,
    syncedOrder
  }
})
