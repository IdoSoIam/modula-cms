import type { PageBuilderContent, SectionContainerWidth, ThemeColorSelection, ThemeColorToken, VerticalAlign } from '#modula/shared/pageBuilder'
import { createThemeColorSelection } from '#modula/shared/pageBuilder'
import type { CmsEventsPageSettings, CmsPlanningPageSettings } from '#modula/shared/events'
import { createDefaultEventsPageSettings, createDefaultPlanningPageSettings } from '#modula/shared/events'
import cmsProjectConfig from '#modula/cms.project.config'

export const CMS_LOCALES = ['fr', 'en'] as const

export type CmsLocale = typeof CMS_LOCALES[number]

export type CmsPageType = 'CMS' | 'APPLICATION' | 'HYBRID'
export type CmsPageStatus = 'DRAFT' | 'PUBLISHED'
export type CmsPageSpecialRole = 'construction'
export type CmsApplicationPosition = 'BEFORE_CONTENT' | 'AFTER_CONTENT'
export type CmsNavigationMenu = 'PRIMARY' | 'FOOTER'
export type CmsNavigationItemType = 'CMS_PAGE' | 'APPLICATION_ROUTE' | 'EXTERNAL_URL'
export type CmsHeaderNavigationStyle = 'ghost' | 'soft' | 'outline' | 'solid' | 'menu' | 'underline'
export type CmsHeaderSubmenuTrigger = 'hover' | 'click'
export type CmsHeaderSubmenuAnimation = 'none' | 'fade' | 'scale' | 'slide'
export type CmsHeaderMobileLogoPosition = 'left' | 'right'
export type CmsFooterAlign = 'start' | 'center'
export type CmsFooterContainerAlign = 'start' | 'center' | 'between'
export type CmsApplicationGridColumns = 1 | 2 | 3 | 4
export type CmsApplicationViewMode = 'grid' | 'list'
export type CmsCookieServiceCategory = 'essential' | 'preferences' | 'third_party' | 'marketing'
export type CmsCookieServiceStorage = 'cookie' | 'localStorage' | 'sessionStorage' | 'script'
export const CMS_HEADER_NAVIGATION_STYLES: CmsHeaderNavigationStyle[] = ['ghost', 'soft', 'outline', 'solid', 'menu', 'underline']
export const CMS_HEADER_SUBMENU_TRIGGERS: CmsHeaderSubmenuTrigger[] = ['hover', 'click']
export const CMS_HEADER_SUBMENU_ANIMATIONS: CmsHeaderSubmenuAnimation[] = ['none', 'fade', 'scale', 'slide']
export const CMS_HEADER_MOBILE_LOGO_POSITIONS: CmsHeaderMobileLogoPosition[] = ['left', 'right']

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
  mobileHeightPx: number
  mobileLogoHeightPx: number
  showSiteName: boolean
  showSiteTagline: boolean
  mobileHeaderShowSiteName: boolean
  mobileHeaderShowSiteTagline: boolean
  mobileHeaderLogoPosition: CmsHeaderMobileLogoPosition
  mobileMenuShowSiteName: boolean
  mobileMenuShowSiteTagline: boolean
  mobileMenuLogoPosition: CmsHeaderMobileLogoPosition
  mobileBurgerPosition: CmsHeaderMobileLogoPosition
  showPrimaryNavigation: boolean
  navigationStyle: CmsHeaderNavigationStyle
  submenuTrigger: CmsHeaderSubmenuTrigger
  submenuAnimation: CmsHeaderSubmenuAnimation
  submenuRadiusPx: number
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  navigationActiveBackgroundColor?: ThemeColorSelection | null
  navigationActiveTextColor?: ThemeColorSelection | null
  navigationHoverBackgroundColor?: ThemeColorSelection | null
  navigationHoverTextColor?: ThemeColorSelection | null
  submenuBackgroundColor?: ThemeColorSelection | null
  submenuTextColor?: ThemeColorSelection | null
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

export interface CmsBasketsPageSettings {
  title: CmsLocalizedText
  subtitle: CmsLocalizedText
  containerWidth: SectionContainerWidth
  gridColumns: CmsApplicationGridColumns
  showOrdersBanner: boolean
  showDescriptions: boolean
  showComposition: boolean
  showImages: boolean
  showAvailabilityBadges: boolean
  showPrice: boolean
  cardBackgroundColor?: ThemeColorSelection | null
  itemBackgroundColor?: ThemeColorSelection | null
}

export interface CmsNewsPageSettings {
  title: CmsLocalizedText
  subtitle: CmsLocalizedText
  containerWidth: SectionContainerWidth
  defaultViewMode: CmsApplicationViewMode
  gridColumns: Exclude<CmsApplicationGridColumns, 4>
  showSort: boolean
  showViewToggle: boolean
  showCoverImage: boolean
  showPublishedDate: boolean
  showExcerpt: boolean
  excerptLines: 2 | 3 | 4
  cardBackgroundColor?: ThemeColorSelection | null
}

export interface CmsCookieService {
  id: string
  name: CmsLocalizedText
  description: CmsLocalizedText
  category: CmsCookieServiceCategory
  storage: CmsCookieServiceStorage
  keys: string[]
  required: boolean
  enabled: boolean
}

export interface CmsCookieBannerSettings {
  enabled: boolean
  title: CmsLocalizedText
  text: CmsLocalizedText
  acceptLabel: CmsLocalizedText
  refuseLabel: CmsLocalizedText
  customizeLabel: CmsLocalizedText
  saveLabel: CmsLocalizedText
  privacyPagePath: string
  cookieName: string
  services: CmsCookieService[]
}

export type CmsSiteSettingsTemplatePayload = Omit<CmsSiteSettings, 'cookieBanner'>

export interface CmsSiteSettings {
  siteName: CmsLocalizedText
  siteTagline: CmsLocalizedText
  logo: CmsImageAsset
  favicon: CmsImageAsset
  header: CmsHeaderSettings
  footer: CmsFooterSettings
  socialLinks: CmsSocialLink[]
  basketsPage: CmsBasketsPageSettings
  newsPage: CmsNewsPageSettings
  eventsPage: CmsEventsPageSettings
  planningPage: CmsPlanningPageSettings
  cookieBanner: CmsCookieBannerSettings
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
  specialRole?: CmsPageSpecialRole | null
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
  navigationItemKey: string
  parentItemKey: string | null
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
  navigationItemKey: string
  parentItemKey: string | null
  href: string
  newTab: boolean
  visible: boolean
  position: number
  children: ResolvedCmsNavigationItem[]
}

export interface ResolvedCmsPage {
  id: number | null
  path: string
  slug: string
  pageType: CmsPageType
  status: CmsPageStatus
  specialRole?: CmsPageSpecialRole | null
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
  socialLinks: any[]
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
      fr: cmsProjectConfig.seed.defaultSiteName.fr,
      en: cmsProjectConfig.seed.defaultSiteName.en
    },
    siteTagline: {
      fr: cmsProjectConfig.seed.defaultSiteTagline.fr,
      en: cmsProjectConfig.seed.defaultSiteTagline.en
    },
    logo: {
      src: '/images/logo-removebg-preview.png',
      alt: {
        fr: 'Logo du site',
        en: 'Site logo'
      }
    },
    favicon: {
      src: '/favicon.ico',
      alt: {
        fr: 'Icône du site',
        en: 'Site icon'
      }
    },
    header: {
      heightPx: 84,
      logoHeightPx: 48,
      mobileHeightPx: 72,
      mobileLogoHeightPx: 40,
      showSiteName: true,
      showSiteTagline: false,
      mobileHeaderShowSiteName: true,
      mobileHeaderShowSiteTagline: false,
      mobileHeaderLogoPosition: 'left',
      mobileMenuShowSiteName: true,
      mobileMenuShowSiteTagline: true,
      mobileMenuLogoPosition: 'left',
      mobileBurgerPosition: 'left',
      showPrimaryNavigation: true,
      navigationStyle: 'ghost',
      submenuTrigger: 'hover',
      submenuAnimation: 'fade',
      submenuRadiusPx: 18,
      backgroundColor: createThemeColorSelection('base-100'),
      textColor: createThemeColorSelection('base-content'),
      navigationActiveBackgroundColor: createThemeColorSelection('primary'),
      navigationActiveTextColor: createThemeColorSelection('primary-content'),
      navigationHoverBackgroundColor: createThemeColorSelection('base-200'),
      navigationHoverTextColor: createThemeColorSelection('base-content'),
      submenuBackgroundColor: createThemeColorSelection('base-100'),
      submenuTextColor: createThemeColorSelection('base-content'),
      sticky: true
    },
    footer: {
      columns: createDefaultCmsFooterColumns(),
      containerWidth: 'xwide',
      containerAlign: 'between',
      backgroundColor: createThemeColorSelection('neutral'),
      textColor: createThemeColorSelection('neutral-content'),
      copyright: {
        fr: 'Nom du site. Tous droits réservés.',
        en: 'Site name. All rights reserved.'
      }
    },
    socialLinks: [
      {
        id: 'facebook',
        label: {
          fr: 'Facebook',
          en: 'Facebook'
        },
        href: '',
        icon: 'mdi:facebook'
      }
    ],
    basketsPage: {
      title: {
        fr: 'Paniers',
        en: 'Baskets'
      },
      subtitle: {
        fr: 'Consultez les paniers disponibles et choisissez votre mode de retrait ou de livraison.',
        en: 'Browse available baskets and choose your pickup or delivery option.'
      },
      containerWidth: 'wide',
      gridColumns: 3,
      showOrdersBanner: true,
      showDescriptions: true,
      showComposition: true,
      showImages: true,
      showAvailabilityBadges: true,
      showPrice: true,
      cardBackgroundColor: createThemeColorSelection('base-200'),
      itemBackgroundColor: createThemeColorSelection('base-200')
    },
    newsPage: {
      title: {
        fr: 'Actualités',
        en: 'News'
      },
      subtitle: {
        fr: 'Suivez les actualités, les nouveautés et les temps forts de saison de la ferme.',
        en: 'Follow the latest farm news, updates and seasonal highlights.'
      },
      containerWidth: 'wide',
      defaultViewMode: 'grid',
      gridColumns: 2,
      showSort: true,
      showViewToggle: true,
      showCoverImage: true,
      showPublishedDate: true,
      showExcerpt: true,
      excerptLines: 3,
      cardBackgroundColor: createThemeColorSelection('base-200')
    },
    eventsPage: createDefaultEventsPageSettings(),
    planningPage: createDefaultPlanningPageSettings(),
    cookieBanner: {
      enabled: true,
      title: {
        fr: 'Cookies et préférences',
        en: 'Cookies and preferences'
      },
      text: {
        fr: 'Nous utilisons des cookies et stockages techniques pour le fonctionnement du site, la langue et certaines intégrations tierces.',
        en: 'We use cookies and browser storage for site functionality, language and some third-party integrations.'
      },
      acceptLabel: {
        fr: 'Tout accepter',
        en: 'Accept all'
      },
      refuseLabel: {
        fr: 'Refuser le non essentiel',
        en: 'Reject non-essential'
      },
      customizeLabel: {
        fr: 'Personnaliser',
        en: 'Customize'
      },
      saveLabel: {
        fr: 'Enregistrer mes choix',
        en: 'Save my choices'
      },
      privacyPagePath: '/privacy',
      cookieName: 'cms_cookie_consent',
      services: [
        {
          id: 'session-auth',
          name: { fr: 'Session utilisateur', en: 'User session' },
          description: {
            fr: 'Conserve la session de connexion et protège les accès privés.',
            en: 'Keeps the login session and protects private access.'
          },
          category: 'essential',
          storage: 'cookie',
          keys: ['auth_session'],
          required: true,
          enabled: true
        },
        {
          id: 'locale-cookie',
          name: { fr: 'Langue du site', en: 'Site language' },
          description: {
            fr: 'Mémorise la langue choisie pour les prochaines visites.',
            en: 'Stores the chosen language for future visits.'
          },
          category: 'essential',
          storage: 'cookie',
          keys: ['i18n_redirected'],
          required: false,
          enabled: true
        },
        {
          id: 'theme-storage',
          name: { fr: 'Thème visuel', en: 'Visual theme' },
          description: {
            fr: 'Mémorise le thème visuel choisi dans le navigateur.',
            en: 'Stores the selected visual theme in the browser.'
          },
          category: 'essential',
          storage: 'localStorage',
          keys: ['theme-preference'],
          required: false,
          enabled: true
        },
        {
          id: 'locale-storage',
          name: { fr: 'Préférence de langue locale', en: 'Local language preference' },
          description: {
            fr: 'Mémorise localement la langue détectée ou choisie.',
            en: 'Stores the detected or chosen language locally.'
          },
          category: 'essential',
          storage: 'localStorage',
          keys: ['preferred-locale'],
          required: false,
          enabled: true
        },
        {
          id: 'facebook-sdk',
          name: { fr: 'Facebook SDK', en: 'Facebook SDK' },
          description: {
            fr: 'Active l\'intégration Facebook susceptible de déposer des cookies tiers.',
            en: 'Enables the Facebook integration which may set third-party cookies.'
          },
          category: 'third_party',
          storage: 'script',
          keys: ['facebook-sdk', 'fbm_*', 'fbc', 'fbp'],
          required: false,
          enabled: false
        }
      ]
    }
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
  const column1 = createDefaultCmsFooterColumn('footer-col-1', 'Présentation')
  column1.blocks = [
    createCmsFooterBlock('logo', 1),
    createCmsFooterBlock('site-name', 2),
    createCmsFooterBlock('site-tagline', 3)
  ]

  const column2 = createDefaultCmsFooterColumn('footer-col-2', 'Informations')
  const hoursTitle = createCmsFooterBlock('title', 1)
  hoursTitle.text = { fr: 'Horaires', en: 'Opening hours' }
  const openingHours = createCmsFooterBlock('opening-hours', 3)
  column2.blocks = [hoursTitle, openingHours]

  const column3 = createDefaultCmsFooterColumn('footer-col-3', 'Contact')
  const contactTitle = createCmsFooterBlock('title', 1)
  contactTitle.text = { fr: 'Contact', en: 'Contact' }
  const contactLine1 = createCmsFooterBlock('text', 2)
  contactLine1.text = {
    fr: 'Nom du site\nAdresse du site',
    en: 'Site name\nSite address'
  }
  const contactLine2 = createCmsFooterBlock('text', 3)
  contactLine2.text = { fr: 'Téléphone', en: 'Phone' }
  const contactLine3 = createCmsFooterBlock('text', 4)
  contactLine3.text = {
    fr: 'email@site.fr',
    en: 'site@email.com'
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
      navigationItemKey: 'nav-home',
      parentItemKey: null,
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
      navigationItemKey: 'nav-news',
      parentItemKey: null,
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
      navigationItemKey: 'nav-baskets',
      parentItemKey: null,
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
      navigationItemKey: 'nav-contact',
      parentItemKey: null,
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
      navigationItemKey: 'nav-privacy',
      parentItemKey: null,
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
      navigationItemKey: 'nav-legal',
      parentItemKey: null,
      href: '/terms',
      pageId: null,
      newTab: false,
      visible: true,
      position: 1
    }
  ]
}

export function buildResolvedNavigationPreview(items: CmsNavigationItemPayload[]): PublicSiteShell['navigation'] {
  const visibleItems = items
    .filter(item => item.visible)
    .map((item, index) => ({
      id: index + 1,
      menu: item.menu,
      itemType: item.itemType,
      labels: item.labels,
      label: item.title,
      navigationItemKey: item.navigationItemKey,
      parentItemKey: item.parentItemKey,
      href: item.href,
      newTab: item.newTab,
      visible: item.visible,
      position: item.position,
      children: [] as ResolvedCmsNavigationItem[]
    }))

  const buildTree = (menu: CmsNavigationMenu) => {
    const nodes = visibleItems
      .filter(item => item.menu === menu)
      .map(item => ({ ...item, children: [] as ResolvedCmsNavigationItem[] }))

    const byKey = new Map(nodes.map(node => [node.navigationItemKey, node]))
    const roots: ResolvedCmsNavigationItem[] = []

    for (const node of nodes) {
      if (node.parentItemKey && byKey.has(node.parentItemKey)) {
        byKey.get(node.parentItemKey)?.children.push(node)
      } else {
        roots.push(node)
      }
    }

    const sortTree = (entries: ResolvedCmsNavigationItem[]) => {
      entries.sort((left, right) => left.position - right.position)
      for (const entry of entries) {
        sortTree(entry.children)
      }
    }

    sortTree(roots)
    return roots
  }

  return {
    primary: buildTree('PRIMARY'),
    footer: buildTree('FOOTER')
  }
}

export function createDefaultCmsPagePayload(path: string, title = ''): CmsPagePayload {
  const normalizedSlug = path === '/' ? 'index' : path.replace(/^\/+|\/+$/g, '').replace(/\//g, '-')

  return {
    path,
    slug: normalizedSlug || 'page',
    pageType: 'CMS',
    status: 'DRAFT',
    specialRole: null,
    templateKey: 'default',
    rendererKey: '',
    applicationPosition: 'AFTER_CONTENT',
    title: title || normalizedSlug || 'page',
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

export const CMS_APPLICATION_GRID_COLUMNS = [1, 2, 3, 4] as const
export const CMS_APPLICATION_GRID_COLUMN_LABELS: Record<CmsApplicationGridColumns, string> = {
  1: '1 colonne',
  2: '2 colonnes',
  3: '3 colonnes',
  4: '4 colonnes'
}

export const CMS_APPLICATION_VIEW_MODES = ['grid', 'list'] as const
export const CMS_APPLICATION_VIEW_MODE_LABELS: Record<CmsApplicationViewMode, string> = {
  grid: 'Grille',
  list: 'Liste'
}
