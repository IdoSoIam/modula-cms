import type { CmsRegistryPaymentConfig, CmsRegistryPaymentLineItem, CmsRegistryPaymentRecord } from '#modula/shared/registry'
import { createRegistryCheckoutSession, getRegistryPaymentBySession } from '#modula/server/utils/cmsRegistry'
import { getFeatureFlags } from '#modula/server/utils/settings'

export interface PaymentCheckoutLineItem extends CmsRegistryPaymentLineItem {}

export interface PaymentCheckoutOptions {
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  locale?: string
  metadata?: Record<string, string>
  lineItems: PaymentCheckoutLineItem[]
  orderId: string
  orderNumber?: string
}

export interface PaymentCheckoutSession {
  id: string
  url: string | null
  status: string | null
  mode: string
  paymentIntentId: string | null
}

async function getPaymentRuntimeConfig() {
  const [featureFlags, publicConfig] = await Promise.all([
    getFeatureFlags(),
    getOnlinePaymentPublicConfig(),
  ])

  return {
    enabled: featureFlags.onlinePaymentsEnabled && publicConfig.enabled,
    provider: publicConfig.provider,
    publicConfig,
  }
}

export async function getOnlinePaymentPublicConfig(): Promise<{
  enabled: boolean
  provider: 'stripe_connect' | 'none'
  publishableKey: string
  config: CmsRegistryPaymentConfig | null
}> {
  try {
    const config = await getRegistryPaymentConfigSafe()
    return {
      enabled: Boolean(config && config.configured && config.provider === 'stripe_connect'),
      provider: config?.provider === 'stripe_connect' ? 'stripe_connect' : 'none',
      publishableKey: config?.publishableKey || '',
      config,
    }
  } catch {
    return {
      enabled: false,
      provider: 'none',
      publishableKey: '',
      config: null,
    }
  }
}

async function getRegistryPaymentConfigSafe() {
  const { getRegistryPaymentConfig } = await import('#modula/server/utils/cmsRegistry')
  return await getRegistryPaymentConfig()
}

export async function isStripeConfigured() {
  const config = await getPaymentRuntimeConfig()
  return Boolean(config.enabled && config.provider === 'stripe_connect')
}

export async function getStripePublicConfig() {
  const config = await getPaymentRuntimeConfig()
  return {
    enabled: config.enabled,
    provider: config.provider,
    publishableKey: config.publicConfig.publishableKey,
    config: config.publicConfig.config,
  }
}

export async function createStripeCheckoutSession(options: PaymentCheckoutOptions): Promise<PaymentCheckoutSession> {
  const config = await getPaymentRuntimeConfig()
  if (!config.enabled || config.provider !== 'stripe_connect') {
    throw createError({
      statusCode: 503,
      statusMessage: 'Online payments unavailable',
      message: 'Le paiement en ligne n’est pas configuré sur cette instance.',
    })
  }

  const record = await createRegistryCheckoutSession({
    orderId: options.orderId,
    orderNumber: options.orderNumber,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
    customerEmail: options.customerEmail,
    locale: options.locale,
    metadata: options.metadata,
    lineItems: options.lineItems,
  })

  return mapRegistryPaymentToSession(record)
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<PaymentCheckoutSession> {
  const record = await getRegistryPaymentBySession(sessionId)
  return mapRegistryPaymentToSession(record)
}

export async function retrieveRegistryPaymentRecord(sessionId: string) {
  return await getRegistryPaymentBySession(sessionId)
}

function mapRegistryPaymentToSession(record: CmsRegistryPaymentRecord): PaymentCheckoutSession {
  return {
    id: record.providerSessionId || record.id,
    url: record.checkoutUrl,
    status: record.providerPaymentStatus || record.paymentStatus,
    mode: 'payment',
    paymentIntentId: record.providerPaymentIntentId,
  }
}
