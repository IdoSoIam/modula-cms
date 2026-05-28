import generatedCmsProjectConfig from './cms.project.generated'
import { defineCmsProjectConfig, mergeCmsProjectConfig, parseCmsProjectConfigJson } from './shared/platform'

const baseConfig = defineCmsProjectConfig({
  site: {
    key: 'ferme-campeyrigoux',
    displayName: 'Ferme du Campeyrigoux',
    defaultLocale: 'fr',
    publicUrl: 'https://ferme-du-campeyrigoux.ferme-du-campeyrigoux.workers.dev',
    tagline: {
      fr: 'Depuis 2024',
      en: 'Since 2024'
    },
    defaultPlaceName: 'Ferme du Campeyrigoux',
    defaultVolunteerPlaceName: 'Cuisine de la ferme',
    defaultPlaceCity: "Saint-Sébastien-d'Aigrefeuille",
    defaultFarmPickupAddress: 'Ferme du Campeyrigoux, 31350 Sepx'
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
      fr: 'Ferme du Campeyrigoux',
      en: 'Ferme du Campeyrigoux'
    },
    defaultSiteTagline: {
      fr: 'Depuis 2024',
      en: 'Since 2024'
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
