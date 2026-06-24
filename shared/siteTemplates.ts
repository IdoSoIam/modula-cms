import type { CmsLocalizedText } from '#modula/shared/cms'

export const FALLBACK_SITE_TEMPLATE_KEY = 'modula-presentation'
export const CMS_SITE_TEMPLATE_KEYS = [FALLBACK_SITE_TEMPLATE_KEY] as const
export const BUNDLED_SYSTEM_SITE_TEMPLATE_KEYS = ['modula-presentation', 'farm', 'association'] as const
export const BUNDLED_SYSTEM_TEMPLATE_ASSET_SOURCES: Record<string, string[]> = {
  'modula-presentation': [
    '/site-templates/modula-hero.svg',
    '/site-templates/preview-modula.svg',
    '/site-templates/preview-farm.svg',
    '/site-templates/preview-association.svg',
    '/site-templates/modula-mark.svg'
  ],
  farm: [
    '/site-templates/farm-hero.svg',
    '/site-templates/preview-farm.svg'
  ],
  association: [
    '/site-templates/association-hero.svg',
    '/site-templates/preview-association.svg'
  ]
}

export type CmsSiteTemplateKey = string
export type BundledSystemSiteTemplateKey = typeof BUNDLED_SYSTEM_SITE_TEMPLATE_KEYS[number]

export interface CmsSiteTemplateDefinition {
  key: string
  label: CmsLocalizedText
  description: CmsLocalizedText
  icon: string
  previewImage: string
  highlights: CmsLocalizedText[]
  themeNames: string[]
  sourceType?: 'system' | 'custom' | 'fallback'
}

export const FALLBACK_SITE_TEMPLATE: CmsSiteTemplateDefinition = {
  key: FALLBACK_SITE_TEMPLATE_KEY,
  label: {
    fr: 'Modula CMS simple',
    en: 'Simple Modula CMS'
  },
  description: {
    fr: 'Fallback local minimal quand aucun modèle distant n’est disponible.',
    en: 'Minimal local fallback when no remote template is available.'
  },
  icon: 'mdi:view-dashboard-outline',
  previewImage: '/brand/modula-mark.svg',
  highlights: [
    {
      fr: 'Socle simple, neutre et immédiatement installable.',
      en: 'Simple, neutral and immediately installable baseline.'
    }
  ],
  themeNames: ['Modula Studio'],
  sourceType: 'fallback'
}

export const BUNDLED_SYSTEM_SITE_TEMPLATES: CmsSiteTemplateDefinition[] = [
  {
    key: 'modula-presentation',
    label: {
      fr: 'Modula CMS simple',
      en: 'Simple Modula CMS'
    },
    description: {
      fr: 'Vitrine CMS polyvalente avec pages éditoriales, événements et planning.',
      en: 'Versatile CMS showcase with editorial pages, events and planning.'
    },
    icon: 'mdi:view-dashboard-outline',
    previewImage: '/site-templates/preview-modula.svg',
    highlights: [
      {
        fr: 'Base neutre et claire pour présenter un projet, une activité ou un service.',
        en: 'Clear and neutral baseline for showcasing a project, activity or service.'
      },
      {
        fr: 'Navigation, contenus et thèmes pensés pour servir de socle générique.',
        en: 'Navigation, content and themes designed as a generic foundation.'
      }
    ],
    themeNames: ['Modula Studio', 'Modula Ocean', 'Modula Noir', 'Modula Sunset'],
    sourceType: 'system'
  },
  {
    key: 'farm',
    label: {
      fr: 'Template ferme',
      en: 'OnSite template'
    },
    description: {
      fr: 'Présente paniers, actualités de la ferme, vente directe et événements saisonniers.',
      en: 'Showcases baskets, farm news, direct sales and seasonal events.'
    },
    icon: 'mdi:tractor-variant',
    previewImage: '/site-templates/preview-farm.svg',
    highlights: [
      {
        fr: 'Pensé pour une ferme locale avec paniers, récoltes et rendez-vous publics.',
        en: 'Designed for a local farm with baskets, harvest updates and public activities.'
      },
      {
        fr: 'Active les fonctionnalités boutique et la communication terrain.',
        en: 'Enables shop features and field-oriented communication.'
      }
    ],
    themeNames: ['Harvest'],
    sourceType: 'system'
  },
  {
    key: 'association',
    label: {
      fr: 'Template association',
      en: 'Association template'
    },
    description: {
      fr: 'Orienté planning, événements publics et mobilisation bénévole.',
      en: 'Focused on planning, public events and volunteer coordination.'
    },
    icon: 'mdi:account-group-outline',
    previewImage: '/site-templates/preview-association.svg',
    highlights: [
      {
        fr: 'Met l’accent sur le planning, les permanences et la vie collective.',
        en: 'Emphasizes planning, volunteer shifts and community life.'
      },
      {
        fr: 'Active les rôles associatifs et une structure adaptée aux événements.',
        en: 'Enables association roles and an event-oriented structure.'
      }
    ],
    themeNames: ['Collective Day'],
    sourceType: 'system'
  }
]

export const CMS_SITE_TEMPLATES: CmsSiteTemplateDefinition[] = [FALLBACK_SITE_TEMPLATE]

export function isCmsSiteTemplateKey(value: unknown): value is CmsSiteTemplateKey {
  return typeof value === 'string' && value.trim().length > 0
}
