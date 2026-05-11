import { getPublicSiteShell } from '~/server/utils/cms'
import { getContactEmail, getOrdersWindow, getFeatureFlags, getFarmPickupConfig, getSetting, SETTING_KEYS } from '~/server/utils/settings'

export default defineEventHandler(async () => {
  const [fb, ordersWindow, featureFlags, farmPickup, contactEmail, siteShell] = await Promise.all([
    getSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED),
    getOrdersWindow(),
    getFeatureFlags(),
    getFarmPickupConfig(),
    getContactEmail(),
    getPublicSiteShell('fr'),
  ])
  return {
    facebookFluxDeactivated: fb === 'true',
    inDevelopment: featureFlags.inDevelopment,
    ordersWindow,
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    farmPickup,
    contactEmail,
    adminEmail: contactEmail,
    cms: siteShell
  }
})
