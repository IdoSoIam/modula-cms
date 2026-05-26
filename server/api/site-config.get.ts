import { getCmsSpecialPagePath, getPublicSiteShell } from '~/server/utils/cms'
import { getAdminPhone, getContactEmail, getOrdersWindow, getFeatureFlags, getFarmPickupConfig, getSetting, SETTING_KEYS } from '~/server/utils/settings'
import { getPublicDaisyUiThemeConfig } from '~/server/utils/themes'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const featureFlags = await getFeatureFlags()
  const [fb, ordersWindow, farmPickup, contactEmail, adminPhone, siteShell, themes, constructionPagePath] = await Promise.all([
    getSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED),
    getOrdersWindow(),
    getFarmPickupConfig(),
    getContactEmail(),
    getAdminPhone(),
    getPublicSiteShell('fr', featureFlags),
    getPublicDaisyUiThemeConfig(),
    getCmsSpecialPagePath('construction')
  ])
  return {
    facebookFluxDeactivated: fb === 'true',
    inDevelopment: featureFlags.inDevelopment,
    ordersWindow,
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    featureFlags,
    farmPickup,
    contactEmail,
    adminEmail: contactEmail,
    adminPhone,
    cms: siteShell,
    themes,
    constructionPagePath
  }
})
