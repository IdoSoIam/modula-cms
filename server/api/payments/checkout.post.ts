import {
  createStripeCheckoutSession,
  isStripeConfigured,
} from "#modula/server/services/payment/paymentService";

interface CheckoutBody {
  orderId: string;
  orderNumber?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  locale?: string;
  metadata?: Record<string, string>;
  lineItems?: Array<{
    name: string;
    amount: number;
    quantity?: number;
    currency?: string;
    description?: string;
    imageUrl?: string;
    taxBehavior?: "inclusive" | "exclusive";
    taxCode?: string;
  }>;
}

export default defineEventHandler(async (event) => {
  if (!(await isStripeConfigured())) {
    throw createError({
      statusCode: 503,
      statusMessage: "Online payments unavailable",
      message: "Le paiement en ligne n’est pas configuré sur cette instance.",
    });
  }

  const body = await readBody<CheckoutBody>(event);
  if (
    !body?.orderId ||
    !body?.successUrl ||
    !body?.cancelUrl ||
    !Array.isArray(body.lineItems) ||
    !body.lineItems.length
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid checkout payload",
      message:
        "Le paiement nécessite un identifiant de commande, des URLs de retour et au moins une ligne.",
    });
  }

  return await createStripeCheckoutSession({
    orderId: body.orderId,
    orderNumber: body.orderNumber,
    successUrl: body.successUrl,
    cancelUrl: body.cancelUrl,
    customerEmail: body.customerEmail,
    locale: body.locale,
    metadata: body.metadata,
    lineItems: body.lineItems,
  });
});
