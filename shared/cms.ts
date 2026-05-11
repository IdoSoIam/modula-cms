import type { HomePageContent } from '~/shared/homePage'

export const CMS_LOCALES = ['fr', 'en'] as const

export type CmsLocale = typeof CMS_LOCALES[number]

export type CmsPageType = 'CMS' | 'APPLICATION' | 'HYBRID'
export type CmsPageStatus = 'DRAFT' | 'PUBLISHED'
export type CmsApplicationPosition = 'BEFORE_CONTENT' | 'AFTER_CONTENT'
export type CmsNavigationMenu = 'PRIMARY' | 'FOOTER'
export type CmsNavigationItemType = 'CMS_PAGE' | 'APPLICATION_ROUTE' | 'EXTERNAL_URL'

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
  sticky: boolean
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
}

export interface CmsFooterSettings {
  columns: CmsFooterColumn[]
  copyright: CmsLocalizedText
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
  content: HomePageContent
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
  content: HomePageContent
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

export function createEmptyHomePageContent(): HomePageContent {
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
      fr: 'Production locale, bio et de saison',
      en: 'Local, organic and seasonal production'
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
      sticky: true
    },
    footer: {
      columns: createDefaultCmsFooterColumns(),
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
    showFooterNavigation: false
  }
}

export function createDefaultCmsFooterColumns(): CmsFooterColumn[] {
  const column1 = createDefaultCmsFooterColumn('footer-col-1', 'La ferme')
  column1.text = {
    fr: 'Production locale, bio et de saison.',
    en: 'Local, organic and seasonal production.'
  }
  column1.image = {
    src: '/images/logo-removebg-preview.png',
    alt: {
      fr: 'Logo de la Ferme du Campeyrigoux',
      en: 'Ferme du Campeyrigoux logo'
    }
  }

  const column2 = createDefaultCmsFooterColumn('footer-col-2', 'Horaires')
  column2.showOpeningHours = true

  const column3 = createDefaultCmsFooterColumn('footer-col-3', 'Contact')
  column3.showContactDetails = true

  const column4 = createDefaultCmsFooterColumn('footer-col-4', 'Suivre la ferme')
  column4.showSocialLinks = true

  return [column1, column2, column3, column4]
}

export function createDefaultCmsPageTranslation(): CmsPageTranslation {
  return {
    title: '',
    navigationLabel: '',
    seo: createEmptyCmsPageSeo(),
    content: createEmptyHomePageContent()
  }
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
