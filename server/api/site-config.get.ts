import { getSetting, SETTING_KEYS, getOrdersWindow, getFeatureFlags, getFarmPickupConfig } from '~/server/utils/settings'

export default defineEventHandler(async () => {
  const [fb, ordersWindow, featureFlags, farmPickup, adminEmail] = await Promise.all([
    getSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED),
    getOrdersWindow(),
    getFeatureFlags(),
    getFarmPickupConfig(),
    getSetting(SETTING_KEYS.ADMIN_EMAIL),
  ])
  return {
    facebookFluxDeactivated: fb === 'true',
    inDevelopment: featureFlags.inDevelopment,
    ordersWindow,
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    farmPickup,
    adminEmail
  }
})
