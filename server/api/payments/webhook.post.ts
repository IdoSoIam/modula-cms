import { verifyStripeWebhook } from '#modula/server/services/payment/paymentService'
import { db } from '#modula/server/data/client'

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

  if (stripeEvent.type === 'checkout.session.completed' || stripeEvent.type === 'checkout.session.async_payment_succeeded') {
    const session = stripeEvent.data.object as { id?: string }
    if (session.id) {
      await db.shopOrder.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
          paidAt: new Date()
        }
      })
    }
  }

  if (stripeEvent.type === 'checkout.session.expired' || stripeEvent.type === 'checkout.session.async_payment_failed') {
    const session = stripeEvent.data.object as { id?: string }
    if (session.id) {
      await db.shopOrder.updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: {
          paymentStatus: 'FAILED'
        }
      })
    }
  }

  return {
    received: true,
    type: stripeEvent.type,
    objectId: 'id' in stripeEvent.data.object ? String((stripeEvent.data.object as { id?: string }).id || '') : ''
  }
})
