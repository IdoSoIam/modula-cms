import Stripe from "stripe";
import {
  getFeatureFlags,
  getOnlinePaymentsSettings,
} from "#modula/server/utils/settings";

export interface PaymentCheckoutLineItem {
  name: string;
  amount: number;
  quantity?: number;
  currency?: string;
  description?: string;
  imageUrl?: string;
  taxBehavior?: 'inclusive' | 'exclusive';
  taxCode?: string;
}

export interface PaymentCheckoutOptions {
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  lineItems: PaymentCheckoutLineItem[];
  automaticTaxEnabled?: boolean;
}

export interface PaymentCheckoutSession {
  id: string;
  url: string | null;
  status: string | null;
  mode: string;
  paymentIntentId: string | null;
}

interface PaymentRuntimeConfig {
  enabled: boolean;
  provider: "stripe" | "none";
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

async function getPaymentRuntimeConfig(): Promise<PaymentRuntimeConfig> {
  const [featureFlags, settings] = await Promise.all([
    getFeatureFlags(),
    getOnlinePaymentsSettings(),
  ]);

  return {
    enabled: featureFlags.onlinePaymentsEnabled,
    provider: settings.provider,
    publishableKey:
      settings.stripePublishableKey ||
      process.env.STRIPE_PUBLISHABLE_KEY?.trim() ||
      "",
    secretKey:
      settings.stripeSecretKey || process.env.STRIPE_SECRET_KEY?.trim() || "",
    webhookSecret:
      settings.stripeWebhookSecret ||
      process.env.STRIPE_WEBHOOK_SECRET?.trim() ||
      "",
  };
}

async function createStripeClient() {
  const config = await getPaymentRuntimeConfig();
  if (!config.enabled || config.provider !== "stripe" || !config.secretKey) {
    throw createError({
      statusCode: 503,
      statusMessage: "Stripe unavailable",
      message: "Stripe n’est pas configuré sur cette instance.",
    });
  }

  return {
    stripe: new Stripe(config.secretKey),
    config,
  };
}

export async function isStripeConfigured() {
  const config = await getPaymentRuntimeConfig();
  return Boolean(
    config.enabled && config.provider === "stripe" && config.secretKey,
  );
}

export async function getStripePublicConfig() {
  const config = await getPaymentRuntimeConfig();
  return {
    enabled: Boolean(
      config.enabled && config.provider === "stripe" && config.secretKey,
    ),
    provider: config.provider,
    publishableKey: config.publishableKey,
  };
}

export async function createStripeCheckoutSession(
  options: PaymentCheckoutOptions,
): Promise<PaymentCheckoutSession> {
  const { stripe } = await createStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.customerEmail,
    metadata: options.metadata,
    automatic_tax: options.automaticTaxEnabled ? { enabled: true } : undefined,
    line_items: options.lineItems.map((item) => ({
      quantity: Math.max(1, item.quantity || 1),
      price_data: {
        currency: item.currency || "eur",
        unit_amount: Math.max(0, Math.round(item.amount)),
        tax_behavior: item.taxBehavior,
        product_data: {
          name: item.name,
          description: item.description,
          images: item.imageUrl ? [item.imageUrl] : undefined,
          tax_code: item.taxCode || undefined,
        },
      },
    })),
  });

  return {
    id: session.id,
    url: session.url,
    status: session.payment_status,
    mode: session.mode,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null,
  };
}

export async function retrieveStripeCheckoutSession(
  sessionId: string,
): Promise<PaymentCheckoutSession> {
  const session = await retrieveStripeCheckoutSessionRaw(sessionId);

  return {
    id: session.id,
    url: session.url,
    status: session.payment_status,
    mode: session.mode,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null,
  };
}

export async function retrieveStripeCheckoutSessionRaw(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const { stripe } = await createStripeClient();
  return await stripe.checkout.sessions.retrieve(sessionId);
}

export async function verifyStripeWebhook(rawBody: string, signature: string) {
  const { stripe, config } = await createStripeClient();
  if (!config.webhookSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: "Stripe webhook unavailable",
      message:
        "Le secret webhook Stripe n’est pas configuré sur cette instance.",
    });
  }

  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.webhookSecret,
  );
}
