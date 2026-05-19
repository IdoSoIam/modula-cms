import { getCmsSpecialPagePath, getPublicSiteShell } from '~/server/utils/cms'
import { getAdminPhone, getContactEmail, getOrdersWindow, getFeatureFlags, getFarmPickupConfig, getSetting, SETTING_KEYS } from '~/server/utils/settings'
import { getPublicDaisyUiThemeConfig } from '~/server/utils/themes'

export default defineEventHandler(async () => {
  const [fb, ordersWindow, featureFlags, farmPickup, contactEmail, adminPhone, siteShell, themes, constructionPagePath] = await Promise.all([
    getSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED),
    getOrdersWindow(),
    getFeatureFlags(),
    getFarmPickupConfig(),
    getContactEmail(),
    getAdminPhone(),
    getPublicSiteShell('fr'),
    getPublicDaisyUiThemeConfig(),
    getCmsSpecialPagePath('construction')
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
    adminPhone,
    cms: siteShell,
    themes,
    constructionPagePath
  }
})
