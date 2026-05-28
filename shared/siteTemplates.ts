import type { CmsLocalizedText } from '#modula/shared/cms'

export const CMS_SITE_TEMPLATE_KEYS = ['modula-presentation', 'farm', 'association'] as const

export type CmsSiteTemplateKey = typeof CMS_SITE_TEMPLATE_KEYS[number]

export interface CmsSiteTemplateDefinition {
  key: CmsSiteTemplateKey
  label: CmsLocalizedText
  description: CmsLocalizedText
  icon: string
  previewImage: string
  highlights: CmsLocalizedText[]
  themeNames: string[]
}

export const CMS_SITE_TEMPLATES: CmsSiteTemplateDefinition[] = [
  {
    key: 'modula-presentation',
    label: {
      fr: 'Présentation Modula CMS',
      en: 'Modula CMS showcase'
    },
    description: {
      fr: 'Un site vitrine générique pour présenter le CMS, ses pages et ses modules.',
      en: 'A generic showcase website to present the CMS, its pages and its modules.'
    },
    icon: 'mdi:view-dashboard-outline',
    previewImage: '/site-templates/preview-modula.svg',
    highlights: [
      {
        fr: 'Présentation visuelle des templates, des modules et du live edit.',
        en: 'Visual presentation of templates, modules and live edit.'
      },
      {
        fr: 'Thèmes premium dédiés à la vitrine CMS.',
        en: 'Premium themes dedicated to the CMS showcase.'
      }
    ],
    themeNames: ['Modula Studio', 'Modula Ocean', 'Modula Noir', 'Modula Sunset']
  },
  {
    key: 'farm',
    label: {
      fr: 'Ferme / production locale',
      en: 'Farm / local production'
    },
    description: {
      fr: 'Met l\'accent sur les paniers, les actualités, les visites et la vente directe.',
      en: 'Focuses on baskets, news, visits and direct sales.'
    },
    icon: 'mdi:sprout-outline',
    previewImage: '/site-templates/preview-farm.svg',
    highlights: [
      {
        fr: 'Parcours orienté vente directe et saisonnalité.',
        en: 'Flow focused on direct sales and seasonality.'
      },
      {
        fr: 'Bloc contact prêt à l\'emploi avec infos de ferme.',
        en: 'Ready-to-use contact block with farm details.'
      },
      {
        fr: 'Charte champêtre claire et chaleureuse.',
        en: 'Warm, field-inspired visual identity.'
      }
    ],
    themeNames: ['Recolte', 'Champ ensoleillé', 'Nuit à l\'étable']
  },
  {
    key: 'association',
    label: {
      fr: 'Association / collectif',
      en: 'Association / collective'
    },
    description: {
      fr: 'Met l\'accent sur les permanences, les événements et l\'engagement bénévole.',
      en: 'Focuses on volunteer shifts, events and community participation.'
    },
    icon: 'mdi:account-group-outline',
    previewImage: '/site-templates/preview-association.svg',
    highlights: [
      {
        fr: 'Planning central pour permanences et participation.',
        en: 'Central planning for shifts and participation.'
      },
      {
        fr: 'Séparation claire entre communication publique et interne.',
        en: 'Clear separation between public and internal communication.'
      },
      {
        fr: 'Thème collectif contrasté et lisible.',
        en: 'Contrasted and readable collective theme.'
      }
    ],
    themeNames: ['Collective Day', 'Collective Night']
  }
]

export function isCmsSiteTemplateKey(value: unknown): value is CmsSiteTemplateKey {
  return typeof value === 'string' && (CMS_SITE_TEMPLATE_KEYS as readonly string[]).includes(value)
}
