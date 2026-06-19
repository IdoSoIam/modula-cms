import {
  createStripeCheckoutSession,
  isStripeConfigured,
} from "#modula/server/services/payment/paymentService";

interface CheckoutBody {
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    name: string;
    amount: number;
    quantity?: number;
    currency?: string;
    description?: string;
    imageUrl?: string;
  }>;
}

export default defineEventHandler(async (event) => {
  if (!(await isStripeConfigured())) {
    throw createError({
      statusCode: 503,
      statusMessage: "Stripe unavailable",
      message: "Stripe n’est pas configuré sur cette instance.",
    });
  }

  const body = await readBody<CheckoutBody>(event);
  if (
    !body?.successUrl ||
    !body?.cancelUrl ||
    !Array.isArray(body.lineItems) ||
    !body.lineItems.length
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid checkout payload",
      message:
        "Le paiement Stripe nécessite des URLs de retour et au moins une ligne de commande.",
    });
  }

  return await createStripeCheckoutSession({
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
    customerEmail: body.customerEmail,
    metadata: body.metadata,
    lineItems: body.lineItems,
  });
});
