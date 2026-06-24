import { getRegistryPaymentConfig } from '#modula/server/utils/cmsRegistry'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getFeatureFlags } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const [featureFlags, paymentConfig] = await Promise.all([
    getFeatureFlags(),
    getRegistryPaymentConfig(),
  ])

  return {
    onlinePaymentsEnabled: featureFlags.onlinePaymentsEnabled,
    onlinePayments: paymentConfig,
  }
})
