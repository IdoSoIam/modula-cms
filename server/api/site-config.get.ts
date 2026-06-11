import cmsProjectConfig from '#modula/cms.project.config'
import { getCmsSpecialPagePath, getPublicSiteShell } from '#modula/server/utils/cms'
import { getAdminPhone, getContactEmail, getDefaultFarmPickupConfig, getDefaultFeatureFlags, getOrdersWindow, getFeatureFlags, getFarmPickupConfig, getSetting, SETTING_KEYS } from '#modula/server/utils/settings'
import { getPublicDaisyUiThemeConfig } from '#modula/server/utils/themes'
import { getCmsInstallStatus } from '#modula/server/utils/install'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const installStatus = await getCmsInstallStatus()
  const installRequired = !installStatus.installed && !installStatus.generatedConfigExists

  if (!installStatus.databaseReady || !installStatus.installed) {
    return {
      project: {
        key: cmsProjectConfig.site.key,
        displayName: cmsProjectConfig.site.displayName,
        defaultLocale: cmsProjectConfig.site.defaultLocale
      },
      installRequired,
      runtimeCompatible: installStatus.runtimeCompatible,
      runtimeIssue: installStatus.runtimeIssue,
      facebookFluxDeactivated: true,
      inDevelopment: false,
      siteName: cmsProjectConfig.site.displayName,
      ordersWindow: {
        from: null,
        to: null,
        message: '',
        isOpen: true
      },
      registerEnabled: false,
      subscriptionsEnabled: false,
      featureFlags: getDefaultFeatureFlags(),
      farmPickup: getDefaultFarmPickupConfig(),
      contactEmail: null,
      adminEmail: null,
      adminPhone: null,
      cms: null,
      themes: null,
      constructionPagePath: '/construction'
    }
  }

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
  const defaultLocale = cmsProjectConfig.site.defaultLocale
  const configuredSiteName =
    (defaultLocale === 'en' ? siteShell?.settings?.siteName?.en : siteShell?.settings?.siteName?.fr)
    || siteShell?.settings?.siteName?.fr
    || siteShell?.settings?.siteName?.en
    || cmsProjectConfig.site.displayName

  return {
    project: {
      key: cmsProjectConfig.site.key,
      displayName: cmsProjectConfig.site.displayName,
      defaultLocale: cmsProjectConfig.site.defaultLocale
    },
    installRequired: false,
    runtimeCompatible: installStatus.runtimeCompatible,
    runtimeIssue: installStatus.runtimeIssue,
    facebookFluxDeactivated: fb !== 'false',
    inDevelopment: featureFlags.inDevelopment,
    siteName: configuredSiteName,
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
