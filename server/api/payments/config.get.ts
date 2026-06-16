import { getStripePublicConfig } from '#modula/server/services/payment/paymentService'

export default defineEventHandler(() => {
  return getStripePublicConfig()
})
