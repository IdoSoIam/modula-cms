import { getStripePublicConfig } from "#modula/server/services/payment/paymentService";

export default defineEventHandler(async () => {
  return await getStripePublicConfig();
});
