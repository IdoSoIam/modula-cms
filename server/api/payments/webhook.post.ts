import { verifyStripeWebhook } from '#modula/server/services/payment/paymentService'

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

  return {
    received: true,
    type: stripeEvent.type,
    objectId: 'id' in stripeEvent.data.object ? String((stripeEvent.data.object as { id?: string }).id || '') : ''
  }
})
