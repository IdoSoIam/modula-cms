import { getRegistryPaymentConfig, getRegistryStripeWebhookUrl } from '#modula/server/utils/cmsRegistry'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getFeatureFlags } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [featureFlags, paymentConfig, webhookUrl] = await Promise.all([
    getFeatureFlags(),
    getRegistryPaymentConfig(),
    getRegistryStripeWebhookUrl(),
  ])

  return {
    onlinePaymentsEnabled: featureFlags.onlinePaymentsEnabled,
    onlinePayments: paymentConfig,
    webhookUrl,
  }
})
