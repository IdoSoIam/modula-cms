export type LocalizedText = {
  fr: string
  en: string
}

export type ButtonTone = 'primary' | 'secondary' | 'accent' | 'neutral' | 'outline'
export type SectionTone = 'base-100' | 'base-200' | 'neutral'
export type CardTone = 'base' | 'soft' | 'outline'
export type ThemeColorToken =
  | 'transparent'
  | 'base-100'
  | 'base-200'
  | 'base-300'
  | 'base-content'
  | 'primary'
  | 'primary-content'
  | 'secondary'
  | 'secondary-content'
  | 'accent'
  | 'accent-content'
  | 'neutral'
  | 'neutral-content'
  | 'info'
  | 'info-content'
  | 'success'
  | 'success-content'
  | 'warning'
  | 'warning-content'
  | 'error'
  | 'error-content'
  | 'white'
  | 'white-90'
  | 'white-70'
  | 'white-10'
  | 'custom'
export type ImageAspect = 'square' | 'landscape' | 'portrait'
export type ImageFit = 'cover' | 'contain'
export type ContentAlign = 'start' | 'center'
export type VerticalAlign = 'start' | 'center' | 'end'
export type SectionContainerWidth = 'narrow' | 'default' | 'wide' | 'full'
export type CardSize = 'sm' | 'md' | 'lg' | 'xl'

export interface HomePageIconOption {
  value: string
  label: string
}

export interface HomePageButton {
  label: LocalizedText
  href: string
  tone: ButtonTone
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  borderColor?: ThemeColorSelection | null
}

export interface ThemeColorSelection {
  token: ThemeColorToken
  customHex?: string
  opacity?: number
}

export interface HomePageCard {
  id: string
  title: LocalizedText
  text: LocalizedText
  icon?: string
  tone: CardTone
  size: CardSize
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  iconColor?: ThemeColorSelection | null
  iconBackgroundColor?: ThemeColorSelection | null
  borderColor?: ThemeColorSelection | null
  backdropBlur?: boolean
  primaryButton?: HomePageButton | null
  secondaryButton?: HomePageButton | null
}

export interface HomePageImageBlock {
  type: 'image'
  imageUrl: string
  alt: LocalizedText
  aspect: ImageAspect
  fit: ImageFit
  framed: boolean
}

export interface HomePageContentBlock {
  type: 'content'
  align: ContentAlign
  verticalAlign: VerticalAlign
  textColor?: ThemeColorSelection | null
  badge: LocalizedText
  title: LocalizedText
  text: LocalizedText
  cards: HomePageCard[]
  primaryButton?: HomePageButton | null
  secondaryButton?: HomePageButton | null
}

export type HomePageColumn = HomePageImageBlock | HomePageContentBlock

export interface HomePageTwoColumnsSection {
  id: string
  type: 'two-columns'
  enabled: boolean
  tone: SectionTone
  containerWidth: SectionContainerWidth
  backgroundColor?: ThemeColorSelection | null
  verticalAlign: VerticalAlign
  reverseOnDesktop: boolean
  columns: [HomePageColumn, HomePageColumn]
}

export interface HomePageOneColumnSection {
  id: string
  type: 'one-column'
  enabled: boolean
  tone: SectionTone
  containerWidth: SectionContainerWidth
  backgroundColor?: ThemeColorSelection | null
  verticalAlign: VerticalAlign
  column: HomePageColumn
}

export interface HomePageHeroSection {
  enabled: boolean
  backgroundImageUrl: string
  badge: LocalizedText
  title: LocalizedText
  text: LocalizedText
  primaryButton: HomePageButton
  secondaryButton: HomePageButton | null
  highlights: HomePageCard[]
}

export interface HomePageContent {
  version: 1
  hero: HomePageHeroSection
  sections: Array<HomePageTwoColumnsSection | HomePageOneColumnSection>
}

export const HOME_PAGE_SETTING_VERSION = 1 as const

export const BUTTON_TONES: ButtonTone[] = ['primary', 'secondary', 'accent', 'neutral', 'outline']
export const SECTION_TONES: SectionTone[] = ['base-100', 'base-200', 'neutral']
export const CARD_TONES: CardTone[] = ['base', 'soft', 'outline']
export const IMAGE_ASPECTS: ImageAspect[] = ['landscape', 'square', 'portrait']
export const IMAGE_FITS: ImageFit[] = ['cover', 'contain']
export const CONTENT_ALIGNS: ContentAlign[] = ['start', 'center']
export const VERTICAL_ALIGNS: VerticalAlign[] = ['start', 'center', 'end']
export const SECTION_CONTAINER_WIDTHS: SectionContainerWidth[] = ['narrow', 'default', 'wide', 'full']
export const CARD_SIZES: CardSize[] = ['sm', 'md', 'lg', 'xl']
export const SECTION_CONTAINER_WIDTH_LABELS: Record<SectionContainerWidth, string> = {
  narrow: 'Étroit',
  default: 'Standard',
  wide: 'Large',
  full: 'Pleine largeur'
}
export const CARD_SIZE_LABELS: Record<CardSize, string> = {
  sm: 'Petite',
  md: 'Moyenne',
  lg: 'Grande',
  xl: 'Très grande'
}
export const THEME_COLOR_TOKENS: ThemeColorToken[] = [
  'transparent',
  'base-100',
  'base-200',
  'base-300',
  'base-content',
  'primary',
  'primary-content',
  'secondary',
  'secondary-content',
  'accent',
  'accent-content',
  'neutral',
  'neutral-content',
  'info',
  'info-content',
  'success',
  'success-content',
  'warning',
  'warning-content',
  'error',
  'error-content',
  'white',
  'white-90',
  'white-70',
  'white-10',
  'custom'
]
export const THEME_COLOR_LABELS: Record<ThemeColorToken, string> = {
  transparent: 'Transparent',
  'base-100': 'Base 100',
  'base-200': 'Base 200',
  'base-300': 'Base 300',
  'base-content': 'Base Content',
  primary: 'Primary',
  'primary-content': 'Primary Content',
  secondary: 'Secondary',
  'secondary-content': 'Secondary Content',
  accent: 'Accent',
  'accent-content': 'Accent Content',
  neutral: 'Neutral',
  'neutral-content': 'Neutral Content',
  info: 'Info',
  'info-content': 'Info Content',
  success: 'Success',
  'success-content': 'Success Content',
  warning: 'Warning',
  'warning-content': 'Warning Content',
  error: 'Error',
  'error-content': 'Error Content',
  white: 'White',
  'white-90': 'White 90%',
  'white-70': 'White 70%',
  'white-10': 'White 10%',
  custom: 'Custom'
}
export const HOME_PAGE_ICON_OPTIONS: HomePageIconOption[] = [
  { value: '', label: 'Aucune icone' },
  { value: 'mdi:leaf', label: 'Feuille' },
  { value: 'mdi:sprout', label: 'Pousse' },
  { value: 'mdi:basket-outline', label: 'Panier' },
  { value: 'mdi:food-apple-outline', label: 'Pomme' },
  { value: 'mdi:carrot', label: 'Carotte' },
  { value: 'mdi:egg-outline', label: 'Oeuf' },
  { value: 'mdi:flower-outline', label: 'Fleur' },
  { value: 'mdi:calendar-check-outline', label: 'Calendrier' },
  { value: 'mdi:clock-outline', label: 'Horloge' },
  { value: 'mdi:truck-fast-outline', label: 'Camion' },
  { value: 'mdi:storefront-outline', label: 'Boutique' },
  { value: 'mdi:store-marker-outline', label: 'Point relais' },
  { value: 'mdi:home-outline', label: 'Maison' },
  { value: 'mdi:home-heart', label: 'Ferme / maison' },
  { value: 'mdi:map-marker-outline', label: 'Localisation' },
  { value: 'mdi:map-marker-radius-outline', label: 'Territoire' },
  { value: 'mdi:information-outline', label: 'Information' },
  { value: 'mdi:check-circle-outline', label: 'Validation' },
  { value: 'mdi:heart-outline', label: 'Coeur' },
  { value: 'mdi:account-group-outline', label: 'Groupe' },
  { value: 'mdi:weather-sunny', label: 'Soleil' },
  { value: 'mdi:water-outline', label: 'Eau' },
  { value: 'mdi:star-outline', label: 'Etoile' }
]

const ICONIFY_NAME_PATTERN = /^(?:@[a-z0-9]+:)?[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/

export function pickLocalizedText(locale: string, value: LocalizedText | null | undefined) {
  if (!value) return ''
  return locale === 'en' ? value.en : value.fr
}

export function isValidIconifyName(value: string) {
  return ICONIFY_NAME_PATTERN.test(value)
}

export function cloneHomePageContent(content: HomePageContent): HomePageContent {
  return JSON.parse(JSON.stringify(content)) as HomePageContent
}

export function createEmptyLocalizedText(): LocalizedText {
  return { fr: '', en: '' }
}

export function createEmptyButton(): HomePageButton {
  return {
    label: createEmptyLocalizedText(),
    href: '',
    tone: 'primary',
    backgroundColor: null,
    textColor: null,
    borderColor: null
  }
}

export function createThemeColorSelection(token: ThemeColorToken = 'primary', customHex = '#3b4d28', opacity = 100): ThemeColorSelection {
  return {
    token,
    customHex,
    opacity
  }
}

export function createEmptyCard(id: string): HomePageCard {
  return {
    id,
    title: createEmptyLocalizedText(),
    text: createEmptyLocalizedText(),
    icon: '',
    tone: 'soft',
    size: 'md',
    backgroundColor: null,
    textColor: null,
    iconColor: null,
    iconBackgroundColor: null,
    borderColor: null,
    backdropBlur: false,
    primaryButton: null,
    secondaryButton: null
  }
}

export function createEmptyContentBlock(): HomePageContentBlock {
  return {
    type: 'content',
    align: 'start',
    verticalAlign: 'center',
    textColor: null,
    badge: createEmptyLocalizedText(),
    title: createEmptyLocalizedText(),
    text: createEmptyLocalizedText(),
    cards: [],
    primaryButton: null,
    secondaryButton: null
  }
}

export function createEmptyImageBlock(): HomePageImageBlock {
  return {
    type: 'image',
    imageUrl: '',
    alt: createEmptyLocalizedText(),
    aspect: 'landscape',
    fit: 'cover',
    framed: true
  }
}

export function createEmptyTwoColumnsSection(id: string): HomePageTwoColumnsSection {
  return {
    id,
    type: 'two-columns',
    enabled: true,
    tone: 'base-100',
    containerWidth: 'default',
    backgroundColor: null,
    verticalAlign: 'center',
    reverseOnDesktop: false,
    columns: [createEmptyContentBlock(), createEmptyImageBlock()]
  }
}

export function createEmptyOneColumnSection(id: string): HomePageOneColumnSection {
  return {
    id,
    type: 'one-column',
    enabled: true,
    tone: 'base-100',
    containerWidth: 'default',
    backgroundColor: null,
    verticalAlign: 'start',
    column: createEmptyContentBlock()
  }
}

export function getAlternatingSectionTone(index: number): SectionTone {
  // Force l'alternance base-100 / base-200 pour les sections
  return index % 2 === 0 ? 'base-100' : 'base-200'
}

function resetButtonColors(button?: HomePageButton | null) {
  if (!button) return
  button.backgroundColor = null
  button.textColor = null
  button.borderColor = null
}

function resetCardColors(card: HomePageCard) {
  card.backgroundColor = null
  card.textColor = null
  card.iconColor = null
  card.iconBackgroundColor = null
  card.borderColor = null
  resetButtonColors(card.primaryButton)
  resetButtonColors(card.secondaryButton)
}

function resetColumnColors(column: HomePageColumn) {
  if (column.type !== 'content') return
  column.textColor = null
  resetButtonColors(column.primaryButton)
  resetButtonColors(column.secondaryButton)
  column.cards.forEach(resetCardColors)
}

export function applyDefaultSectionStyling(content: HomePageContent) {
  content.sections.forEach((section, index) => {
    section.tone = getAlternatingSectionTone(index)
    section.backgroundColor = null

    if (section.type === 'two-columns') {
      section.columns.forEach(resetColumnColors)
      return
    }

    resetColumnColors(section.column)
  })

  return content
}

export function createDefaultHomePageContent(farmAddress: string): HomePageContent {
  return {
    version: HOME_PAGE_SETTING_VERSION,
    hero: {
      enabled: true,
      backgroundImageUrl: '/images/plaquette.jpg',
      badge: {
        fr: 'Production locale, bio et de saison dans les Cevennes',
        en: 'Local, organic and seasonal production in the Cevennes'
      },
      title: {
        fr: 'Ferme du Campeyrigoux',
        en: 'Ferme du Campeyrigoux'
      },
      text: {
        fr: 'Micro-ferme agroécologique en agriculture biologique',
        en: 'Micro-ecological organic farm'
      },
      primaryButton: {
        label: { fr: 'Voir les paniers', en: 'View baskets' },
        href: '/paniers',
        tone: 'primary'
      },
      secondaryButton: {
        label: { fr: 'Nous rencontrer', en: 'Meet us' },
        href: '/contact',
        tone: 'outline'
      },
      highlights: [
        {
          id: 'hero-highlight-1',
          title: { fr: 'Production bio', en: 'Organic production' },
          text: {
            fr: 'Maraîchage et productions fermières conduits dans une logique agricole biologique.',
            en: 'Market gardening and farm productions run with an organic approach.'
          },
          icon: 'mdi:leaf',
          tone: 'soft',
          size: 'md'
        },
        {
          id: 'hero-highlight-2',
          title: { fr: 'Circuit court', en: 'Short supply chain' },
          text: {
            fr: 'Paniers de légumes, vente directe et relation simple avec la ferme.',
            en: 'Vegetable baskets, direct sales and a simple relationship with the farm.'
          },
          icon: 'mdi:basket-outline',
          tone: 'soft',
          size: 'md'
        },
        {
          id: 'hero-highlight-3',
          title: { fr: 'Ancrage local', en: 'Local roots' },
          text: {
            fr: 'Ferme installée à Saint-Sebastien-d\'Aigrefeuille, au cœur des Cévennes.',
            en: 'A farm based in Saint-Sebastien-d\'Aigrefeuille, in the heart of the Cevennes.'
          },
          icon: 'mdi:map-marker-outline',
          tone: 'soft',
          size: 'md'
        }
      ]
    },
    sections: [
      {
        id: 'activities',
        type: 'two-columns',
        enabled: true,
        tone: 'base-100',
        containerWidth: 'default',
        verticalAlign: 'center',
        reverseOnDesktop: false,
        columns: [
          {
            type: 'content',
            align: 'start',
            verticalAlign: 'center',
            badge: { fr: 'Nos Activités', en: 'Our Activities' },
            title: { fr: 'Une ferme à taille humaine', en: 'A human-scale farm' },
            text: {
              fr: 'Une ferme à taille humaine qui combine production maraîchère, paniers, vente directe et autres ateliers agricoles de manière progressive et cohérente.',
              en: 'A human-scale farm combining vegetable production, baskets, direct sales and other agricultural workshops in a progressive and coherent way.'
            },
            cards: [
              {
                id: 'activities-1',
                title: { fr: 'Maraîchage Bio', en: 'Organic Market Gardening' },
                text: {
                  fr: 'Production de légumes frais et de saison en agriculture biologique.',
                  en: 'Production of fresh, seasonal vegetables in organic farming.'
                },
                icon: 'mdi:sprout',
                tone: 'soft',
                size: 'md'
              },
              {
                id: 'activities-2',
                title: { fr: 'Paniers de légumes', en: 'Vegetable baskets' },
                text: {
                  fr: 'Réservez votre panier hebdomadaire de légumes frais, bio et de saison, récoltés à la ferme.',
                  en: 'Reserve your weekly basket of fresh, organic, seasonal vegetables harvested at the farm.'
                },
                icon: 'mdi:basket-outline',
                tone: 'soft',
                size: 'md'
              },
              {
                id: 'activities-3',
                title: { fr: 'Œufs & Volailles', en: 'Eggs & Poultry' },
                text: {
                  fr: 'Élevage de poules en plein air et production d\'œufs bio.',
                  en: 'Free-range poultry farming and organic egg production.'
                },
                icon: 'mdi:egg-outline',
                tone: 'soft',
                size: 'md'
              },
              {
                id: 'activities-4',
                title: { fr: 'Diversification de la ferme', en: 'Farm diversification' },
                text: {
                  fr: 'La ferme développe aussi d\'autres ateliers et cultures pour construire un modèle agricole résilient.',
                  en: 'The farm is also developing other crops and activities to build a resilient agricultural model.'
                },
                icon: 'mdi:leaf-circle-outline',
                tone: 'soft',
                size: 'md'
              }
            ],
            primaryButton: {
              label: { fr: 'Voir les paniers', en: 'View baskets' },
              href: '/paniers',
              tone: 'primary'
            },
            secondaryButton: null
          },
          {
            type: 'image',
            imageUrl: '/images/erasebg-transformed.png',
            alt: {
              fr: 'Logo de la Ferme du Campeyrigoux',
              en: 'Ferme du Campeyrigoux logo'
            },
            aspect: 'square',
            fit: 'contain',
            framed: true
          }
        ]
      },
      {
        id: 'baskets',
        type: 'two-columns',
        enabled: true,
        tone: 'base-200',
        containerWidth: 'default',
        verticalAlign: 'center',
        reverseOnDesktop: true,
        columns: [
          {
            type: 'image',
            imageUrl: '/images/plaquette.jpg',
            alt: {
              fr: 'Légumes et productions de la ferme',
              en: 'Vegetables and farm produce'
            },
            aspect: 'landscape',
            fit: 'cover',
            framed: true
          },
          {
            type: 'content',
            align: 'start',
            verticalAlign: 'center',
            badge: { fr: 'Des paniers simples à réserver', en: 'Simple baskets to reserve' },
            title: { fr: 'Choisissez votre mode de retrait ou livraison', en: 'Choose your pickup or delivery method' },
            text: {
              fr: 'L\'objectif est de rendre la commande facile à comprendre : vous choisissez votre panier, puis votre mode de retrait ou livraison. Le retrait à la ferme concerne les paniers réservés sur le site.',
              en: 'The goal is to make ordering easy to understand: you choose your basket, then your pickup or delivery method. Farm pickup is for baskets reserved on the website.'
            },
            cards: [
              {
                id: 'baskets-1',
                title: { fr: 'Retrait à la ferme', en: 'Farm pickup' },
                text: {
                  fr: 'Une solution simple pour venir récupérer votre panier réservé directement à la ferme, sur confirmation par email.',
                  en: 'A simple solution to come pick up your reserved basket directly at the farm, upon email confirmation.'
                },
                icon: 'mdi:home-outline',
                tone: 'base',
                size: 'md'
              },
              {
                id: 'baskets-2',
                title: { fr: 'Point relais', en: 'Pickup point' },
                text: {
                  fr: 'Selon les disponibilités, vous pouvez choisir un point de retrait pratique.',
                  en: 'Depending on availability, you can choose a convenient pickup location.'
                },
                icon: 'mdi:store-marker-outline',
                tone: 'base',
                size: 'md'
              },
              {
                id: 'baskets-3',
                title: { fr: 'Livraison tournée', en: 'Delivery tour' },
                text: {
                  fr: 'Pour certaines villes, une tournée de livraison peut être proposée.',
                  en: 'For certain cities, a delivery tour may be offered.'
                },
                icon: 'mdi:truck-fast-outline',
                tone: 'base',
                size: 'md'
              }
            ],
            primaryButton: {
              label: { fr: 'Voir les paniers', en: 'View baskets' },
              href: '/paniers',
              tone: 'primary'
            },
            secondaryButton: null
          }
        ]
      },
      {
        id: 'direct-sale',
        type: 'two-columns',
        enabled: true,
        tone: 'base-100',
        containerWidth: 'default',
        verticalAlign: 'center',
        reverseOnDesktop: false,
        columns: [
          {
            type: 'content',
            align: 'start',
            verticalAlign: 'center',
            badge: { fr: 'Le rendez-vous de la semaine', en: 'The weekly meeting point' },
            title: { fr: 'Vente directe', en: 'Direct Sale' },
            text: {
              fr: 'Deux rendez-vous simples et réguliers pour retrouver les produits de la ferme, poser vos questions et choisir le format qui vous convient.',
              en: 'Two simple weekly meetings to find farm products, ask questions and choose the format that suits you best.'
            },
            cards: [
              {
                id: 'direct-sale-1',
                title: { fr: 'Vente directe à la ferme', en: 'Direct sale at the farm' },
                text: {
                  fr: `Adresse : ${farmAddress}`,
                  en: `Address: ${farmAddress}`
                },
                icon: 'mdi:home-heart',
                tone: 'base',
                size: 'md'
              },
              {
                id: 'direct-sale-2',
                title: { fr: 'Marché de Saint-Sébastien-d\'Aigrefeuille', en: 'Saint-Sebastien-d\'Aigrefeuille market' },
                text: {
                  fr: 'Sur la terrasse du Saint Seb.',
                  en: 'On the Saint Seb terrace.'
                },
                icon: 'mdi:storefront-outline',
                tone: 'base',
                size: 'md'
              },
              {
                id: 'direct-sale-3',
                title: { fr: 'Comment ça marche ?', en: 'How does it work?' },
                text: {
                  fr: 'Je peux venir à la vente à la ferme pour les produits disponibles, ou réserver un panier depuis le site.',
                  en: 'I can come to the farm sale for available products, or reserve a basket from the website.'
                },
                icon: 'mdi:calendar-check-outline',
                tone: 'outline',
                size: 'md'
              }
            ],
            primaryButton: {
              label: { fr: 'Nous trouver', en: 'Find us' },
              href: '/contact',
              tone: 'primary'
            },
            secondaryButton: null
          },
          {
            type: 'image',
            imageUrl: '/images/erasebg-transformed.png',
            alt: {
              fr: 'Logo de la ferme',
              en: 'Farm logo'
            },
            aspect: 'portrait',
            fit: 'contain',
            framed: true
          }
        ]
      },
      {
        id: 'trust-and-cta',
        type: 'two-columns',
        enabled: true,
        tone: 'base-200',
        containerWidth: 'default',
        verticalAlign: 'end',
        reverseOnDesktop: false,
        columns: [
          {
            type: 'content',
            align: 'start',
            verticalAlign: 'center',
            badge: { fr: 'Repères utiles', en: 'Useful landmarks' },
            title: {
              fr: 'Une ferme jeune, concrète et en développement',
              en: 'A young, practical farm project'
            },
            text: {
              fr: 'Le projet s\'appuie sur une installation agricole locale, une démarche biologique et une volonté de rendre des produits fermiers accessibles dans la durée.',
              en: 'The project is built around local farming, an organic approach and the desire to make farm products accessible over time.'
            },
            cards: [
              {
                id: 'trust-1',
                title: { fr: 'Agriculture biologique', en: 'Organic approach' },
                text: {
                  fr: 'La ferme est engagée dans une production centrée sur le vivant et la saisonnalité.',
                  en: 'The farm focuses on living soils, seasonality and practical organic production.'
                },
                icon: 'mdi:leaf',
                tone: 'soft',
                size: 'md'
              },
              {
                id: 'trust-2',
                title: { fr: 'Projet de territoire', en: 'Territorial project' },
                text: {
                  fr: 'Le développement de la ferme s\'inscrit dans un ancrage local fort autour des Cévennes et de la vente en proximité.',
                  en: 'The farm is rooted in the Cevennes with a strong local direct-sale approach.'
                },
                icon: 'mdi:map-marker-radius-outline',
                tone: 'soft',
                size: 'md'
              }
            ],
            primaryButton: null,
            secondaryButton: null
          },
          {
            type: 'content',
            align: 'start',
            verticalAlign: 'center',
            badge: { fr: 'Prochaine étape', en: 'Next step' },
            title: {
              fr: 'Commander un panier ou prendre contact',
              en: 'Reserve a basket or get in touch'
            },
            text: {
              fr: 'Si vous souhaitez suivre les disponibilités, réserver un panier ou simplement en savoir plus sur la ferme, les prochaines étapes sont ici.',
              en: 'If you want to follow availability, reserve a basket or simply learn more about the farm, start here.'
            },
            cards: [],
            primaryButton: {
              label: { fr: 'Réserver un panier', en: 'Reserve a basket' },
              href: '/paniers',
              tone: 'primary'
            },
            secondaryButton: {
              label: { fr: 'Nous écrire', en: 'Contact us' },
              href: '/contact',
              tone: 'outline'
            }
          }
        ]
      }
    ]
  }
}
