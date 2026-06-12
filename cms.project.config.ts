import { defineCmsProjectConfig, mergeCmsProjectConfig, parseCmsProjectConfigJson } from './shared/platform'

const baseConfig = defineCmsProjectConfig({
  site: {
    key: 'modula',
    displayName: 'Modula CMS',
    defaultLocale: 'fr',
    publicUrl: 'https://modula-cms.modula-cms.workers.dev',
    tagline: {
      fr: 'Depuis 2026',
      en: 'Since 2026'
    },
    defaultPlaceName: 'Modula CMS',
    defaultVolunteerPlaceName: 'Modula CMS',
    defaultPlaceCity: 'Modula CMS',
    defaultFarmPickupAddress: 'Modula CMS, Modula CMS'
  },
  platform: {
    runtimeTarget: 'server',
    dbDriver: 'sqlite',
    storageDriver: 'fs'
  },
  storage: {
    filesystemDir: 'public/uploads',
    publicUploadsPath: '/uploads'
  },
  modules: {
    cms: true,
    news: true,
    planning: true,
    events: true,
    shop: true,
    shopBaskets: true,
    shopVegetables: true,
    associationRoles: true
  },
  seed: {
    defaultSiteName: {
      fr: 'Modula CMS',
      en: 'Modula CMS'
    },
    defaultSiteTagline: {
      fr: 'Depuis 2026',
      en: 'Since 2026'
    }
  }
})

const envCmsProjectConfig = parseCmsProjectConfigJson(process.env.CMS_PROJECT_CONFIG_JSON)

export default defineCmsProjectConfig(
  mergeCmsProjectConfig(baseConfig, envCmsProjectConfig)
)
