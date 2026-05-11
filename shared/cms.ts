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

export interface CmsSiteSettings {
  siteName: CmsLocalizedText
  siteTagline: CmsLocalizedText
  logo: CmsImageAsset
  favicon: CmsImageAsset
  footerDescription: CmsLocalizedText
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
    footerDescription: {
      fr: 'Agriculture biologique depuis 2024',
      en: 'Organic farming since 2024'
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
