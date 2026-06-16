import { retrieveStripeCheckoutSession } from '#modula/server/services/payment/paymentService'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing session id',
      message: 'L’identifiant de session Stripe est requis.'
    })
  }

  return await retrieveStripeCheckoutSession(id)
})
