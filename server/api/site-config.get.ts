import cmsProjectConfig from '#modula/cms.project.config'
import { getCmsApplicationPagePath, getCmsSpecialPagePath, getPublicSiteShell } from '#modula/server/utils/cms'
import { getAdminPhone, getContactEmail, getDefaultFarmPickupConfig, getDefaultFeatureFlags, getOrdersWindow, getFeatureFlags, getFarmPickupConfig, getRentalCalendarConfig, getSiteDefaultLocale, getSiteLocales, getSiteLocaleLabels } from '#modula/server/utils/settings'
import { getResolvedPublicDictionary } from '#modula/server/utils/publicDictionary'
import { getPublicDaisyUiThemeConfig } from '#modula/server/utils/themes'
import { getCmsInstallStatus } from '#modula/server/utils/install'
import { listSiteTemplates } from '#modula/server/utils/siteTemplates'
import { FALLBACK_SITE_TEMPLATE_KEY } from '#modula/shared/siteTemplates'
import { buildResolvedNavigationPreview, createDefaultCmsNavigationItems, createDefaultCmsSiteSettings } from '#modula/shared/cms'
import { createDefaultRentalCalendar } from '#modula/shared/rentalCalendar'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const installStatus = await getCmsInstallStatus()
  const installRequired = !installStatus.installed
  const requestedLocale = normalizeRequestedLocale(getQuery(event).locale)

  if (!installStatus.databaseReady || !installStatus.installed) {
    const siteTemplates = await listSiteTemplates().catch(() => [])
    const installTemplate = siteTemplates.find(template => template.key === FALLBACK_SITE_TEMPLATE_KEY) || siteTemplates[0]
    const installPreviewImage = installTemplate?.previewImage || '/brand/modula-mark.svg'
    const defaultSettings = createDefaultCmsSiteSettings()
    const [defaultLocales, defaultLocale, defaultLabels] = await Promise.all([
      getSiteLocales().catch(() => ['fr', 'en']),
      getSiteDefaultLocale().catch(() => cmsProjectConfig.site.defaultLocale),
      getSiteLocaleLabels().catch(() => ({}))
    ])
    const publicDictionary = await getResolvedPublicDictionary(requestedLocale || defaultLocale || 'fr', defaultLocales, defaultLocale || 'fr')
    const preInstallShell = {
      settings: {
        ...defaultSettings,
        logo: {
          ...defaultSettings.logo,
          src: installPreviewImage,
          alt: {
            fr: 'Logo du template',
            en: 'Template logo'
          }
        },
        favicon: {
          ...defaultSettings.favicon,
          src: installPreviewImage,
          alt: {
            fr: 'Icône du template',
            en: 'Template icon'
          }
        }
      },
      socialLinks: defaultSettings.socialLinks,
      navigation: buildResolvedNavigationPreview(createDefaultCmsNavigationItems())
    }
    return {
      project: {
        key: cmsProjectConfig.site.key,
        displayName: cmsProjectConfig.site.displayName,
        defaultLocale
      },
      installRequired,
      runtimeCompatible: installStatus.runtimeCompatible,
      runtimeIssue: installStatus.runtimeIssue,
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
      rentalCalendar: createDefaultRentalCalendar(),
      contactEmail: null,
      adminEmail: null,
      adminPhone: null,
      cms: preInstallShell,
      themes: await getPublicDaisyUiThemeConfig(),
      constructionPagePath: '/construction',
      siteLocales: defaultLocales,
      siteDefaultLocale: defaultLocale,
      localeLabels: defaultLabels,
      publicDictionary
    }
  }

  const featureFlags = await getFeatureFlags()
  const [ordersWindow, farmPickup, rentalCalendar, contactEmail, adminPhone, siteShell, themes, constructionPagePath, shopPagePath, siteLocales, defaultLocale, localeLabels] = await Promise.all([
    getOrdersWindow(),
    getFarmPickupConfig(),
    getRentalCalendarConfig(),
    getContactEmail(),
    getAdminPhone(),
    getPublicSiteShell(requestedLocale || 'fr', featureFlags),
    getPublicDaisyUiThemeConfig(),
    getCmsSpecialPagePath('construction'),
    getCmsApplicationPagePath('shop'),
    getSiteLocales().catch(() => ['fr', 'en']),
    getSiteDefaultLocale().catch(() => cmsProjectConfig.site.defaultLocale),
    getSiteLocaleLabels().catch(() => ({}))
  ])
  const publicDictionary = await getResolvedPublicDictionary(requestedLocale || defaultLocale || 'fr', siteLocales, defaultLocale || 'fr')
  const configuredSiteName =
    (defaultLocale === 'en' ? siteShell?.settings?.siteName?.en : siteShell?.settings?.siteName?.fr)
    || siteShell?.settings?.siteName?.fr
    || siteShell?.settings?.siteName?.en
    || cmsProjectConfig.site.displayName

  return {
    project: {
      key: cmsProjectConfig.site.key,
      displayName: cmsProjectConfig.site.displayName,
      defaultLocale
    },
    installRequired: false,
    runtimeCompatible: installStatus.runtimeCompatible,
    runtimeIssue: installStatus.runtimeIssue,
    inDevelopment: featureFlags.inDevelopment,
    siteName: configuredSiteName,
    ordersWindow,
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    featureFlags,
    farmPickup,
    rentalCalendar,
    contactEmail,
    adminEmail: contactEmail,
    adminPhone,
    cms: siteShell,
    themes,
    constructionPagePath,
    shopPagePath,
    siteLocales,
    siteDefaultLocale: defaultLocale,
    localeLabels,
    publicDictionary
  }
})

function normalizeRequestedLocale(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase()
  return /^[a-z]{2}(?:-[a-z]{2})?$/.test(normalized) ? normalized : null
}
