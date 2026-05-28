import { H3Event } from 'h3'
import { PaymentService } from '#modula/server/services/payment/paymentService'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    const paymentService = new PaymentService()

    const paymentIntent = await paymentService.initiatePayment({
      amount: body.amount,
      currency: 'eur',
      description: body.description
    })

    return paymentIntent
  } catch (error: any) {
    throw createError({
      statusCode: 400,
      message: error.message
    })
  }
})
