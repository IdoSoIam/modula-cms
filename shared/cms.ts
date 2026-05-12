import type { PageBuilderContent, SectionContainerWidth, ThemeColorSelection, ThemeColorToken, VerticalAlign } from '~/shared/pageBuilder'
import { createThemeColorSelection } from '~/shared/pageBuilder'

export const CMS_LOCALES = ['fr', 'en'] as const

export type CmsLocale = typeof CMS_LOCALES[number]

export type CmsPageType = 'CMS' | 'APPLICATION' | 'HYBRID'
export type CmsPageStatus = 'DRAFT' | 'PUBLISHED'
export type CmsApplicationPosition = 'BEFORE_CONTENT' | 'AFTER_CONTENT'
export type CmsNavigationMenu = 'PRIMARY' | 'FOOTER'
export type CmsNavigationItemType = 'CMS_PAGE' | 'APPLICATION_ROUTE' | 'EXTERNAL_URL'
export type CmsFooterAlign = 'start' | 'center'
export type CmsFooterContainerAlign = 'start' | 'center' | 'between'

export interface CmsLocalizedText {
  fr: string
  en: string
}

export interface CmsImageAsset {
  src: string
  alt: CmsLocalizedText
}

export interface CmsSocialLink {
  id: string
  label: CmsLocalizedText
  href: string
  icon?: string
}

export interface CmsShellLink {
  id: string
  label: CmsLocalizedText
  href: string
  newTab?: boolean
}

export interface CmsHeaderSettings {
  heightPx: number
  logoHeightPx: number
  mobileLogoHeightPx: number
  showSiteName: boolean
  showSiteTagline: boolean
  showPrimaryNavigation: boolean
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  sticky: boolean
}

export type CmsFooterBlockType =
  | 'logo'
  | 'site-name'
  | 'site-tagline'
  | 'title'
  | 'text'
  | 'opening-hours'
  | 'contact'
  | 'social-links'
  | 'navigation'

export interface CmsFooterBlock {
  id: string
  type: CmsFooterBlockType
  title?: CmsLocalizedText | null
  text?: CmsLocalizedText | null
  navigationMenu?: CmsNavigationMenu | null
}

export interface CmsFooterColumn {
  id: string
  title: CmsLocalizedText
  text: CmsLocalizedText
  image?: CmsImageAsset | null
  links: CmsShellLink[]
  showOpeningHours: boolean
  showContactDetails: boolean
  showSocialLinks: boolean
  showFooterNavigation: boolean
  align: CmsFooterAlign
  verticalAlign: VerticalAlign
  gapPx: number
  blocks: CmsFooterBlock[]
}

export interface CmsFooterSettings {
  columns: CmsFooterColumn[]
  copyright: CmsLocalizedText
  containerWidth: SectionContainerWidth
  containerAlign: CmsFooterContainerAlign
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
}

export interface CmsSiteSettings {
  siteName: CmsLocalizedText
  siteTagline: CmsLocalizedText
  logo: CmsImageAsset
  favicon: CmsImageAsset
  header: CmsHeaderSettings
  footer: CmsFooterSettings
  socialLinks: CmsSocialLink[]
}

export interface CmsPageSeo {
  metaTitle: string
  metaDescription: string
  ogImage: string
  noindex: boolean
}

export interface CmsPageTranslation {
  title: string
  navigationLabel: string
  seo: CmsPageSeo
  content: PageBuilderContent
}

export interface CmsPagePayload {
  path: string
  slug: string
  pageType: CmsPageType
  status: CmsPageStatus
  templateKey: string
  rendererKey: string
  applicationPosition: CmsApplicationPosition
  title: string
  translations: Record<CmsLocale, CmsPageTranslation>
}

export interface CmsNavigationItemPayload {
  menu: CmsNavigationMenu
  itemType: CmsNavigationItemType
  title: string
  labels: CmsLocalizedText
  href: string
  pageId: number | null
  newTab: boolean
  visible: boolean
  position: number
}

export interface ResolvedCmsNavigationItem {
  id: number
  menu: CmsNavigationMenu
  itemType: CmsNavigationItemType
  labels: CmsLocalizedText
  label: string
  href: string
  newTab: boolean
  visible: boolean
  position: number
}

export interface ResolvedCmsPage {
  id: number | null
  path: string
  slug: string
  pageType: CmsPageType
  status: CmsPageStatus
  templateKey: string
  rendererKey: string
  applicationPosition: CmsApplicationPosition
  title: string
  navigationLabel: string
  seo: CmsPageSeo
  content: PageBuilderContent
}

export interface PublicSiteShell {
  settings: CmsSiteSettings
  navigation: {
    primary: ResolvedCmsNavigationItem[]
    footer: ResolvedCmsNavigationItem[]
  }
}

export function createEmptyCmsLocalizedText(): CmsLocalizedText {
  return { fr: '', en: '' }
}

export function createEmptyCmsPageSeo(): CmsPageSeo {
  return {
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    noindex: false
  }
}

export function createEmptyPageBuilderContent(): PageBuilderContent {
  return {
    version: 1,
    sections: []
  }
}

export function createDefaultCmsSiteSettings(): CmsSiteSettings {
  return {
    siteName: {
      fr: 'Ferme du Campeyrigoux',
      en: 'Ferme du Campeyrigoux'
    },
    siteTagline: {
      fr: 'Agriculture biologique depuis 2024',
      en: 'Organic farming since 2024'
    },
    logo: {
      src: '/images/logo-removebg-preview.png',
      alt: {
        fr: 'Logo de la Ferme du Campeyrigoux',
        en: 'Ferme du Campeyrigoux logo'
      }
    },
    favicon: {
      src: '/favicon.ico',
      alt: {
        fr: 'Icône du site Ferme du Campeyrigoux',
        en: 'Ferme du Campeyrigoux site icon'
      }
    },
    header: {
      heightPx: 84,
      logoHeightPx: 48,
      mobileLogoHeightPx: 40,
      showSiteName: true,
      showSiteTagline: false,
      showPrimaryNavigation: true,
      backgroundColor: createThemeColorSelection('base-100'),
      textColor: createThemeColorSelection('base-content'),
      sticky: true
    },
    footer: {
      columns: createDefaultCmsFooterColumns(),
      containerWidth: 'xwide',
      containerAlign: 'between',
      backgroundColor: createThemeColorSelection('neutral'),
      textColor: createThemeColorSelection('neutral-content'),
      copyright: {
        fr: 'Ferme du Campeyrigoux. Tous droits réservés.',
        en: 'Ferme du Campeyrigoux. All rights reserved.'
      }
    },
    socialLinks: [
      {
        id: 'facebook',
        label: {
          fr: 'Facebook',
          en: 'Facebook'
        },
        href: 'https://www.facebook.com/profile.php?id=61571709076079',
        icon: 'mdi:facebook'
      }
    ]
  }
}

export function createDefaultCmsShellLink(id: string): CmsShellLink {
  return {
    id,
    label: createEmptyCmsLocalizedText(),
    href: '',
    newTab: false
  }
}

export function createDefaultCmsFooterColumn(id: string, title = ''): CmsFooterColumn {
  return {
    id,
    title: {
      fr: title,
      en: title
    },
    text: createEmptyCmsLocalizedText(),
    image: null,
    links: [],
    showOpeningHours: false,
    showContactDetails: false,
    showSocialLinks: false,
    showFooterNavigation: false,
    align: 'start',
    verticalAlign: 'start',
    gapPx: 16,
    blocks: []
  }
}

export function createCmsFooterBlock(type: CmsFooterBlockType, index = 1): CmsFooterBlock {
  return {
    id: `footer-block-${type}-${index}`,
    type,
    title: createEmptyCmsLocalizedText(),
    text: createEmptyCmsLocalizedText(),
    navigationMenu: 'FOOTER'
  }
}

export function createDefaultCmsFooterColumns(): CmsFooterColumn[] {
  const column1 = createDefaultCmsFooterColumn('footer-col-1', 'La ferme')
  column1.blocks = [
    createCmsFooterBlock('logo', 1),
    createCmsFooterBlock('site-name', 2),
    createCmsFooterBlock('site-tagline', 3)
  ]

  const column2 = createDefaultCmsFooterColumn('footer-col-2', 'Horaires')
  const hoursTitle = createCmsFooterBlock('title', 1)
  hoursTitle.text = { fr: 'Horaires', en: 'Opening hours' }
  const farmLabel = createCmsFooterBlock('text', 2)
  farmLabel.text = { fr: 'Vente directe à la ferme', en: 'Direct sale at the farm' }
  const openingHours = createCmsFooterBlock('opening-hours', 3)
  const marketLabel = createCmsFooterBlock('text', 4)
  marketLabel.text = {
    fr: 'Marché de Saint-Sébastien-d\'Aigrefeuille',
    en: 'Saint-Sébastien-d\'Aigrefeuille market'
  }
  const marketHours = createCmsFooterBlock('text', 5)
  marketHours.text = {
    fr: 'Tous les samedi de 9h30 à 12h00',
    en: 'Every Saturday from 9:30am to 12:00pm'
  }
  column2.blocks = [hoursTitle, farmLabel, openingHours, marketLabel, marketHours]

  const column3 = createDefaultCmsFooterColumn('footer-col-3', 'Contact')
  const contactTitle = createCmsFooterBlock('title', 1)
  contactTitle.text = { fr: 'Contact', en: 'Contact' }
  const contactLine1 = createCmsFooterBlock('text', 2)
  contactLine1.text = {
    fr: 'Ferme du Campeyrigoux\n30140 Saint-Sébastien-d\'Aigrefeuille',
    en: 'Ferme du Campeyrigoux\n30140 Saint-Sébastien-d\'Aigrefeuille'
  }
  const contactLine2 = createCmsFooterBlock('text', 3)
  contactLine2.text = { fr: '07 68 55 06 64', en: '07 68 55 06 64' }
  const contactLine3 = createCmsFooterBlock('text', 4)
  contactLine3.text = {
    fr: 'ferme.campeyrigoux@gmail.com',
    en: 'ferme.campeyrigoux@gmail.com'
  }
  column3.blocks = [contactTitle, contactLine1, contactLine2, contactLine3]

  const column4 = createDefaultCmsFooterColumn('footer-col-4', 'Suivez-nous')
  const socialTitle = createCmsFooterBlock('title', 1)
  socialTitle.text = { fr: 'Suivez-nous', en: 'Follow us' }
  column4.blocks = [socialTitle, createCmsFooterBlock('social-links', 2)]

  return [column1, column2, column3, column4]
}

export function createDefaultCmsPageTranslation(): CmsPageTranslation {
  return {
    title: '',
    navigationLabel: '',
    seo: createEmptyCmsPageSeo(),
    content: createEmptyPageBuilderContent()
  }
}

export function createDefaultCmsNavigationItems(): CmsNavigationItemPayload[] {
  return [
    {
      menu: 'PRIMARY',
      itemType: 'APPLICATION_ROUTE',
      title: 'Accueil',
      labels: { fr: 'Accueil', en: 'Home' },
      href: '/',
      pageId: null,
      newTab: false,
      visible: true,
      position: 0
    },
    {
      menu: 'PRIMARY',
      itemType: 'APPLICATION_ROUTE',
      title: 'Actualités',
      labels: { fr: 'Actualités', en: 'News' },
      href: '/news',
      pageId: null,
      newTab: false,
      visible: true,
      position: 1
    },
    {
      menu: 'PRIMARY',
      itemType: 'APPLICATION_ROUTE',
      title: 'Paniers',
      labels: { fr: 'Paniers', en: 'Baskets' },
      href: '/paniers',
      pageId: null,
      newTab: false,
      visible: true,
      position: 2
    },
    {
      menu: 'PRIMARY',
      itemType: 'APPLICATION_ROUTE',
      title: 'Contact',
      labels: { fr: 'Contact', en: 'Contact' },
      href: '/contact',
      pageId: null,
      newTab: false,
      visible: true,
      position: 3
    },
    {
      menu: 'FOOTER',
      itemType: 'APPLICATION_ROUTE',
      title: 'Confidentialité',
      labels: { fr: 'Confidentialité', en: 'Privacy' },
      href: '/privacy',
      pageId: null,
      newTab: false,
      visible: true,
      position: 0
    },
    {
      menu: 'FOOTER',
      itemType: 'APPLICATION_ROUTE',
      title: 'Mentions légales',
      labels: { fr: 'Mentions légales', en: 'Legal notice' },
      href: '/terms',
      pageId: null,
      newTab: false,
      visible: true,
      position: 1
    }
  ]
}

export function createDefaultCmsPagePayload(path: string, title = ''): CmsPagePayload {
  const normalizedSlug = path === '/' ? 'home' : path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-')

  return {
    path,
    slug: normalizedSlug || 'page',
    pageType: 'CMS',
    status: 'DRAFT',
    templateKey: 'default',
    rendererKey: '',
    applicationPosition: 'AFTER_CONTENT',
    title: title || normalizedSlug || 'Nouvelle page',
    translations: {
      fr: createDefaultCmsPageTranslation(),
      en: createDefaultCmsPageTranslation()
    }
  }
}

export function pickCmsLocalizedText(locale: string, value: CmsLocalizedText | null | undefined) {
  if (!value) return ''
  return locale === 'en' ? value.en : value.fr
}

export const CMS_THEME_COLOR_TOKENS: ThemeColorToken[] = [
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
  'white-10'
]

export const CMS_FOOTER_ALIGN_LABELS: Record<CmsFooterAlign, string> = {
  start: 'Gauche',
  center: 'Centre'
}

export const CMS_FOOTER_CONTAINER_ALIGN_LABELS: Record<CmsFooterContainerAlign, string> = {
  start: 'Début',
  center: 'Centre',
  between: 'Réparti'
}
