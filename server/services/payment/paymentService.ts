import Stripe from 'stripe'

export interface PaymentCheckoutLineItem {
  name: string
  amount: number
  quantity?: number
  currency?: string
  description?: string
  imageUrl?: string
}

export interface PaymentCheckoutOptions {
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
  lineItems: PaymentCheckoutLineItem[]
}

export interface PaymentCheckoutSession {
  id: string
  url: string | null
  status: string | null
  mode: string
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY?.trim() || ''
}

function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() || ''
}

function createStripeClient() {
  const secretKey = getStripeSecretKey()
  if (!secretKey) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe unavailable',
      message: 'Stripe n’est pas configuré sur cette instance.'
    })
  }

  return new Stripe(secretKey)
}

export function isStripeConfigured() {
  return Boolean(getStripeSecretKey())
}

export function getStripePublicConfig() {
  return {
    enabled: isStripeConfigured(),
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY?.trim() || ''
  }
}

export async function createStripeCheckoutSession(options: PaymentCheckoutOptions): Promise<PaymentCheckoutSession> {
  const stripe = createStripeClient()
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.customerEmail,
    metadata: options.metadata,
    line_items: options.lineItems.map((item) => ({
      quantity: Math.max(1, item.quantity || 1),
      price_data: {
        currency: item.currency || 'eur',
        unit_amount: Math.max(0, Math.round(item.amount)),
        product_data: {
          name: item.name,
          description: item.description,
          images: item.imageUrl ? [item.imageUrl] : undefined
        }
      }
    }))
  })

  return {
    id: session.id,
    url: session.url,
    status: session.payment_status,
    mode: session.mode
  }
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<PaymentCheckoutSession> {
  const stripe = createStripeClient()
  const session = await stripe.checkout.sessions.retrieve(sessionId)
  return {
    id: session.id,
    url: session.url,
    status: session.payment_status,
    mode: session.mode
  }
}

export async function verifyStripeWebhook(rawBody: string, signature: string) {
  const stripe = createStripeClient()
  const webhookSecret = getStripeWebhookSecret()
  if (!webhookSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stripe webhook unavailable',
      message: 'Le secret webhook Stripe n’est pas configuré sur cette instance.'
    })
  }

  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}
