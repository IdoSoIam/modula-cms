import generatedCmsProjectConfig from './cms.project.generated'
import { defineCmsProjectConfig, mergeCmsProjectConfig, parseCmsProjectConfigJson } from 'modula-cms/project-config'

const baseConfig = defineCmsProjectConfig({
  site: {
    key: 'mon-projet',
    displayName: 'Mon projet',
    defaultLocale: 'fr',
    publicUrl: 'https://example.com',
    tagline: {
      fr: 'Décrivez votre activité',
      en: 'Describe your activity'
    },
    defaultPlaceName: 'Mon projet',
    defaultVolunteerPlaceName: 'Local bénévolat',
    defaultPlaceCity: 'Ma ville',
    defaultFarmPickupAddress: 'Mon adresse de retrait'
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
    shop: false,
    shopBaskets: false,
    shopVegetables: false,
    associationRoles: true
  },
  seed: {
    defaultSiteName: {
      fr: 'Mon projet',
      en: 'My project'
    },
    defaultSiteTagline: {
      fr: 'Décrivez votre activité',
      en: 'Describe your activity'
    }
  }
})

const envCmsProjectConfig = parseCmsProjectConfigJson(process.env.CMS_PROJECT_CONFIG_JSON)

export default defineCmsProjectConfig(
  mergeCmsProjectConfig(
    mergeCmsProjectConfig(baseConfig, generatedCmsProjectConfig),
    envCmsProjectConfig
  )
)
