import { getContactEmail, getOrdersWindow, getFeatureFlags, getFarmPickupConfig, getSetting, SETTING_KEYS } from '~/server/utils/settings'

export default defineEventHandler(async () => {
  const [fb, ordersWindow, featureFlags, farmPickup, contactEmail] = await Promise.all([
    getSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED),
    getOrdersWindow(),
    getFeatureFlags(),
    getFarmPickupConfig(),
    getContactEmail(),
  ])
  return {
    facebookFluxDeactivated: fb === 'true',
    inDevelopment: featureFlags.inDevelopment,
    ordersWindow,
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    farmPickup,
    contactEmail,
    adminEmail: contactEmail
  }
})
