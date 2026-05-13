import { prisma } from '~/prisma/client'
import type { CmsNavigationItem, CmsPage } from '@prisma/client'
import type {
  CmsApplicationPosition,
  CmsFooterBlock,
  CmsLocale,
  CmsNavigationItemPayload,
  CmsNavigationMenu,
  CmsNavigationItemType,
  CmsPagePayload,
  CmsPageSeo,
  CmsPageStatus,
  CmsPageTranslation,
  CmsPageType,
  CmsSiteSettings,
  PublicSiteShell,
  ResolvedCmsNavigationItem,
  ResolvedCmsPage
} from '~/shared/cms'
import {
  CMS_LOCALES,
  createDefaultCmsPagePayload,
  createDefaultCmsPageTranslation,
  createDefaultCmsFooterColumn,
  createDefaultCmsFooterColumns,
  createCmsFooterBlock,
  createDefaultCmsNavigationItems,
  createDefaultCmsShellLink,
  createDefaultCmsSiteSettings,
  createEmptyCmsPageSeo,
  createEmptyPageBuilderContent,
  createEmptyCmsLocalizedText
} from '~/shared/cms'
import type { ThemeColorSelection } from '~/shared/pageBuilder'
import { createThemeColorSelection } from '~/shared/pageBuilder'
import { CMS_THEME_COLOR_TOKENS } from '~/shared/cms'
import { getPageBuilderContent } from '~/server/utils/pageBuilder'
import { getSetting, setSetting, SETTING_KEYS } from '~/server/utils/settings'

function isMissingCmsTableError(error: unknown) {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: string }).code === 'P2021'
    && 'meta' in error
    && typeof (error as { meta?: { modelName?: string } }).meta?.modelName === 'string'
    && String((error as { meta?: { modelName?: string } }).meta?.modelName).startsWith('Cms')
  )
}

async function withCmsTableFallback<T>(action: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  try {
    return await action()
  } catch (error) {
    if (isMissingCmsTableError(error)) {
      return await fallback()
    }
    throw error
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeLocalizedText(value: unknown) {
  if (!isObject(value)) return createEmptyCmsLocalizedText()
  return {
    fr: typeof value.fr === 'string' ? value.fr : '',
    en: typeof value.en === 'string' ? value.en : ''
  }
}

function normalizeImageAsset(value: unknown, fallback: { src: string; alt: { fr: string; en: string } }) {
  const source = isObject(value) ? value : {}
  return {
    src: typeof source.src === 'string' && source.src.trim() ? source.src.trim() : fallback.src,
    alt: normalizeLocalizedText(source.alt)
  }
}

function normalizeThemeColorSelection(value: unknown, fallback: ThemeColorSelection) {
  if (!isObject(value)) return fallback
  const token = typeof value.token === 'string' && CMS_THEME_COLOR_TOKENS.includes(value.token as any)
    ? value.token
    : fallback.token
  const opacity = typeof value.opacity === 'number' && Number.isFinite(value.opacity)
    ? Math.max(0, Math.min(100, Math.round(value.opacity)))
    : (fallback.opacity ?? 100)
  return createThemeColorSelection(token as any, undefined, opacity)
}

function normalizeShellLink(value: unknown, index: number) {
  const fallback = createDefaultCmsShellLink(`link-${index + 1}`)
  if (!isObject(value)) return fallback
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallback.id,
    label: normalizeLocalizedText(value.label),
    href: typeof value.href === 'string' ? value.href.trim() : '',
    newTab: typeof value.newTab === 'boolean' ? value.newTab : false
  }
}

function normalizeFooterBlocks(value: unknown, fallback: ReturnType<typeof createDefaultCmsFooterColumn>, index: number): CmsFooterBlock[] {
  if (Array.isArray(value) && value.length) {
    return value
      .filter(isObject)
      .map((block, blockIndex) => ({
        id: typeof block.id === 'string' && block.id.trim() ? block.id.trim() : `footer-block-${index + 1}-${blockIndex + 1}`,
        type: typeof block.type === 'string' ? block.type as CmsFooterBlock['type'] : 'text',
        title: normalizeLocalizedText(block.title),
        text: normalizeLocalizedText(block.text),
        navigationMenu: block.navigationMenu === 'PRIMARY' ? 'PRIMARY' : 'FOOTER'
      }))
  }

  const legacyBlocks: CmsFooterBlock[] = []
  if (fallback.image?.src || (isObject(value) && isObject(value.image) && typeof value.image.src === 'string' && value.image.src.trim())) {
    legacyBlocks.push(createCmsFooterBlock('logo', 1))
  }
  const title = isObject(value) ? normalizeLocalizedText(value.title) : fallback.title
  if (title.fr || title.en) {
    legacyBlocks.push({
      ...createCmsFooterBlock('title', legacyBlocks.length + 1),
      text: title
    })
  }
  const text = isObject(value) ? normalizeLocalizedText(value.text) : fallback.text
  if (text.fr || text.en) {
    legacyBlocks.push({
      ...createCmsFooterBlock('text', legacyBlocks.length + 1),
      text
    })
  }
  if (isObject(value) && value.showOpeningHours === true) {
    legacyBlocks.push(createCmsFooterBlock('opening-hours', legacyBlocks.length + 1))
  }
  if (isObject(value) && value.showContactDetails === true) {
    legacyBlocks.push(createCmsFooterBlock('contact', legacyBlocks.length + 1))
  }
  if (isObject(value) && value.showSocialLinks === true) {
    legacyBlocks.push(createCmsFooterBlock('social-links', legacyBlocks.length + 1))
  }
  if (isObject(value) && value.showFooterNavigation === true) {
    legacyBlocks.push(createCmsFooterBlock('navigation', legacyBlocks.length + 1))
  }
  return legacyBlocks.length ? legacyBlocks : fallback.blocks
}

function normalizeFooterColumn(value: unknown, index: number) {
  const fallback = createDefaultCmsFooterColumn(`footer-col-${index + 1}`)
  if (!isObject(value)) return fallback
  const hasImageValue = isObject(value.image) && typeof value.image.src === 'string' && value.image.src.trim()
  const image = value.image === null
    ? null
    : (hasImageValue ? normalizeImageAsset(value.image, createDefaultCmsSiteSettings().logo) : null)

  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallback.id,
    title: normalizeLocalizedText(value.title),
    text: normalizeLocalizedText(value.text),
    image,
    links: Array.isArray(value.links)
      ? value.links
          .map((link, linkIndex) => normalizeShellLink(link, linkIndex))
          .filter((link) => Boolean(link.href))
      : [],
    showOpeningHours: typeof value.showOpeningHours === 'boolean' ? value.showOpeningHours : false,
    showContactDetails: typeof value.showContactDetails === 'boolean' ? value.showContactDetails : false,
    showSocialLinks: typeof value.showSocialLinks === 'boolean' ? value.showSocialLinks : false,
    showFooterNavigation: typeof value.showFooterNavigation === 'boolean' ? value.showFooterNavigation : false,
    align: value.align === 'center' ? 'center' : fallback.align,
    verticalAlign: value.verticalAlign === 'center' || value.verticalAlign === 'end' ? value.verticalAlign : fallback.verticalAlign,
    gapPx: typeof value.gapPx === 'number' && Number.isFinite(value.gapPx)
      ? Math.max(4, Math.min(64, Math.round(value.gapPx)))
      : fallback.gapPx,
    blocks: normalizeFooterBlocks(value.blocks, fallback, index)
  }
}

function normalizeFooterColumns(value: unknown) {
  const defaults = createDefaultCmsFooterColumns()
  const source = Array.isArray(value) ? value.slice(0, 4) : []
  return defaults.map((fallback, index) => normalizeFooterColumn(source[index] ?? fallback, index))
}

function mergeMissingDefaultNavigationItems(items: Array<CmsNavigationItemPayload & { id?: number | null }>, menu?: CmsNavigationMenu) {
  const defaults = createDefaultCmsNavigationItems().filter((item) => !menu || item.menu === menu)
  const existingKeys = new Set(items.map((item) => `${item.menu}:${item.href}`))
  const appended = defaults
    .filter((item) => !existingKeys.has(`${item.menu}:${item.href}`))
    .map((item) => ({ id: null, ...item }))

  return [...items, ...appended].sort((a, b) => a.position - b.position)
}

function normalizeGridColumns(value: unknown, fallback: 1 | 2 | 3 | 4, max: 1 | 2 | 3 | 4 = 4) {
  const normalized = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : fallback
  return Math.max(1, Math.min(max, normalized)) as 1 | 2 | 3 | 4
}

function normalizeSeo(value: unknown): CmsPageSeo {
  if (!isObject(value)) {
    return {
      metaTitle: '',
      metaDescription: '',
      ogImage: '',
      noindex: false
    }
  }

  return {
    metaTitle: typeof value.metaTitle === 'string' ? value.metaTitle : '',
    metaDescription: typeof value.metaDescription === 'string' ? value.metaDescription : '',
    ogImage: typeof value.ogImage === 'string' ? value.ogImage : '',
    noindex: typeof value.noindex === 'boolean' ? value.noindex : false
  }
}

function normalizeTranslation(value: unknown): CmsPageTranslation {
  const fallback = createDefaultCmsPageTranslation()
  if (!isObject(value)) return fallback

  return {
    title: typeof value.title === 'string' ? value.title : '',
    navigationLabel: typeof value.navigationLabel === 'string' ? value.navigationLabel : '',
    seo: normalizeSeo(value.seo),
    content: isObject(value.content) && value.content.version === 1 && Array.isArray(value.content.sections)
      ? {
          version: 1,
          sections: value.content.sections
        }
      : fallback.content
  }
}

function normalizeTranslations(value: unknown, path = '/'): Record<CmsLocale, CmsPageTranslation> {
  const fallback = createDefaultCmsPagePayload(path).translations
  if (!isObject(value)) return fallback

  return {
    fr: normalizeTranslation(value.fr),
    en: normalizeTranslation(value.en)
  }
}

function parseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function normalizePath(path: string) {
  if (!path) return '/'
  const trimmed = path.trim()
  if (!trimmed || trimmed === '/') return '/'
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`
}

function isCmsPageType(value: unknown): value is CmsPageType {
  return typeof value === 'string' && CMS_PAGE_TYPES.has(value as CmsPageType)
}

function isCmsPageStatus(value: unknown): value is CmsPageStatus {
  return typeof value === 'string' && CMS_PAGE_STATUSES.has(value as CmsPageStatus)
}

function isCmsApplicationPosition(value: unknown): value is CmsApplicationPosition {
  return typeof value === 'string' && CMS_APPLICATION_POSITIONS.has(value as CmsApplicationPosition)
}

function isCmsNavigationMenu(value: unknown): value is CmsNavigationMenu {
  return typeof value === 'string' && CMS_NAVIGATION_MENUS.has(value as CmsNavigationMenu)
}

function isCmsNavigationItemType(value: unknown): value is CmsNavigationItemType {
  return typeof value === 'string' && CMS_NAVIGATION_ITEM_TYPES.has(value as CmsNavigationItemType)
}

function pageRowToPayload(row: CmsPage): CmsPagePayload {
  return {
    path: normalizePath(row.path),
    slug: row.slug,
    pageType: row.pageType as CmsPageType,
    status: row.status as CmsPageStatus,
    templateKey: row.templateKey,
    rendererKey: row.rendererKey || '',
    applicationPosition: row.applicationPosition as CmsApplicationPosition,
    title: row.title,
    translations: normalizeTranslations(parseJson(row.translationsJson), row.path)
  }
}

function pickTranslation(locale: string, translations: Record<CmsLocale, CmsPageTranslation>) {
  return locale === 'en' ? translations.en : translations.fr
}

function navigationRowToPayload(row: CmsNavigationItem): CmsNavigationItemPayload {
  return {
    menu: row.menu as CmsNavigationMenu,
    itemType: row.itemType as CmsNavigationItemType,
    title: row.title,
    labels: normalizeLocalizedText(parseJson(row.labelsJson)),
    href: row.href,
    pageId: row.pageId ?? null,
    newTab: row.newTab,
    visible: row.visible,
    position: row.position
  }
}

function navigationPayloadToResolved(id: number, payload: CmsNavigationItemPayload, locale: string): ResolvedCmsNavigationItem {
  return {
    id,
    menu: payload.menu,
    itemType: payload.itemType,
    labels: payload.labels,
    label: locale === 'en' ? payload.labels.en : payload.labels.fr,
    href: payload.href,
    newTab: payload.newTab,
    visible: payload.visible,
    position: payload.position
  }
}

function createLegacyRootResolvedPage(locale: string): Promise<ResolvedCmsPage> {
  return getPageBuilderContent().then((content) => ({
    id: null,
    path: '/',
    slug: 'home',
    pageType: 'CMS',
    status: 'PUBLISHED',
    templateKey: 'default',
    rendererKey: '',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'Home' : 'Accueil',
    navigationLabel: locale === 'en' ? 'Home' : 'Accueil',
    seo: {
      metaTitle: locale === 'en' ? 'Organic vegetables, baskets and farm pickup' : 'Légumes bio, paniers et vente à la ferme',
      metaDescription: locale === 'en'
        ? 'Discover seasonal organic vegetables, farm pickup and local basket reservations at Ferme du Campeyrigoux.'
        : 'Découvrez les légumes bio de saison, la vente à la ferme et la réservation de paniers à la Ferme du Campeyrigoux.',
      ogImage: '',
      noindex: false
    },
    content
  }))
}

function createLegacyBasketsResolvedPage(locale: string): ResolvedCmsPage {
  return {
    id: null,
    path: '/paniers',
    slug: 'paniers',
    pageType: 'APPLICATION',
    status: 'PUBLISHED',
    templateKey: 'default',
    rendererKey: 'baskets',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'Baskets' : 'Paniers',
    navigationLabel: locale === 'en' ? 'Baskets' : 'Paniers',
    seo: {
      metaTitle: locale === 'en' ? 'Reserve a vegetable basket' : 'Réserver un panier de légumes',
      metaDescription: locale === 'en'
        ? 'Browse available vegetable baskets, choose pickup or delivery, and send your reservation online.'
        : 'Consultez les paniers de légumes disponibles, choisissez votre retrait ou votre livraison et envoyez votre réservation en ligne.',
      ogImage: '',
      noindex: false
    },
    content: createEmptyPageBuilderContent()
  }
}

function createLegacyNewsResolvedPage(locale: string): ResolvedCmsPage {
  return {
    id: null,
    path: '/news',
    slug: 'news',
    pageType: 'APPLICATION',
    status: 'PUBLISHED',
    templateKey: 'default',
    rendererKey: 'news',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'News' : 'Actualités',
    navigationLabel: locale === 'en' ? 'News' : 'Actualités',
    seo: {
      metaTitle: locale === 'en' ? 'Farm news and updates' : 'Actualités de la ferme',
      metaDescription: locale === 'en'
        ? 'Read the latest farm news, updates and seasonal highlights from Ferme du Campeyrigoux.'
        : 'Suivez les actualités, les nouveautés et les temps forts de saison de la Ferme du Campeyrigoux.',
      ogImage: '',
      noindex: false
    },
    content: createEmptyPageBuilderContent()
  }
}

export async function getCmsSiteSettings(): Promise<CmsSiteSettings> {
  const raw = await getSetting(SETTING_KEYS.CMS_SITE_SETTINGS)
  const parsed = parseJson<CmsSiteSettings>(raw)
  if (!parsed || !isObject(parsed)) {
    return createDefaultCmsSiteSettings()
  }

  const fallback = createDefaultCmsSiteSettings()

  return {
    siteName: normalizeLocalizedText(parsed.siteName),
    siteTagline: normalizeLocalizedText(parsed.siteTagline),
    logo: normalizeImageAsset(parsed.logo, fallback.logo),
    favicon: normalizeImageAsset(parsed.favicon, fallback.favicon),
    header: isObject(parsed.header)
      ? {
          heightPx: typeof parsed.header.heightPx === 'number' ? Math.max(56, Math.min(180, Math.round(parsed.header.heightPx))) : fallback.header.heightPx,
          logoHeightPx: typeof parsed.header.logoHeightPx === 'number' ? Math.max(24, Math.min(140, Math.round(parsed.header.logoHeightPx))) : fallback.header.logoHeightPx,
          mobileLogoHeightPx: typeof parsed.header.mobileLogoHeightPx === 'number' ? Math.max(24, Math.min(120, Math.round(parsed.header.mobileLogoHeightPx))) : fallback.header.mobileLogoHeightPx,
          showSiteName: typeof parsed.header.showSiteName === 'boolean' ? parsed.header.showSiteName : fallback.header.showSiteName,
          showSiteTagline: typeof parsed.header.showSiteTagline === 'boolean' ? parsed.header.showSiteTagline : fallback.header.showSiteTagline,
          showPrimaryNavigation: typeof parsed.header.showPrimaryNavigation === 'boolean' ? parsed.header.showPrimaryNavigation : fallback.header.showPrimaryNavigation,
          backgroundColor: normalizeThemeColorSelection(parsed.header.backgroundColor, fallback.header.backgroundColor || createThemeColorSelection('base-100')),
          textColor: normalizeThemeColorSelection(parsed.header.textColor, fallback.header.textColor || createThemeColorSelection('base-content')),
          sticky: typeof parsed.header.sticky === 'boolean' ? parsed.header.sticky : fallback.header.sticky
        }
      : fallback.header,
    footer: isObject(parsed.footer)
      ? {
          columns: normalizeFooterColumns(parsed.footer.columns),
          containerWidth: typeof parsed.footer.containerWidth === 'string'
            ? parsed.footer.containerWidth as CmsSiteSettings['footer']['containerWidth']
            : fallback.footer.containerWidth,
          containerAlign: parsed.footer.containerAlign === 'start' || parsed.footer.containerAlign === 'center' || parsed.footer.containerAlign === 'between'
            ? parsed.footer.containerAlign
            : fallback.footer.containerAlign,
          backgroundColor: normalizeThemeColorSelection(parsed.footer.backgroundColor, fallback.footer.backgroundColor || createThemeColorSelection('neutral')),
          textColor: normalizeThemeColorSelection(parsed.footer.textColor, fallback.footer.textColor || createThemeColorSelection('neutral-content')),
          copyright: normalizeLocalizedText(parsed.footer.copyright)
        }
      : fallback.footer,
    socialLinks: Array.isArray(parsed.socialLinks)
      ? parsed.socialLinks
          .filter(isObject)
          .map((link, index) => ({
            id: typeof link.id === 'string' ? link.id : `social-${index + 1}`,
            label: normalizeLocalizedText(link.label),
            href: typeof link.href === 'string' ? link.href : '',
            icon: typeof link.icon === 'string' ? link.icon : ''
          }))
          .filter((link) => Boolean(link.href))
      : fallback.socialLinks,
    basketsPage: isObject(parsed.basketsPage)
      ? {
          title: normalizeLocalizedText(parsed.basketsPage.title),
          subtitle: normalizeLocalizedText(parsed.basketsPage.subtitle),
          containerWidth: typeof parsed.basketsPage.containerWidth === 'string'
            ? parsed.basketsPage.containerWidth as CmsSiteSettings['basketsPage']['containerWidth']
            : fallback.basketsPage.containerWidth,
          gridColumns: normalizeGridColumns(parsed.basketsPage.gridColumns, fallback.basketsPage.gridColumns, 4),
          showOrdersBanner: typeof parsed.basketsPage.showOrdersBanner === 'boolean' ? parsed.basketsPage.showOrdersBanner : fallback.basketsPage.showOrdersBanner,
          showDescriptions: typeof parsed.basketsPage.showDescriptions === 'boolean' ? parsed.basketsPage.showDescriptions : fallback.basketsPage.showDescriptions,
          showComposition: typeof parsed.basketsPage.showComposition === 'boolean' ? parsed.basketsPage.showComposition : fallback.basketsPage.showComposition,
          showImages: typeof parsed.basketsPage.showImages === 'boolean' ? parsed.basketsPage.showImages : fallback.basketsPage.showImages,
          showAvailabilityBadges: typeof parsed.basketsPage.showAvailabilityBadges === 'boolean' ? parsed.basketsPage.showAvailabilityBadges : fallback.basketsPage.showAvailabilityBadges,
          showPrice: typeof parsed.basketsPage.showPrice === 'boolean' ? parsed.basketsPage.showPrice : fallback.basketsPage.showPrice,
          cardBackgroundColor: normalizeThemeColorSelection(parsed.basketsPage.cardBackgroundColor, fallback.basketsPage.cardBackgroundColor || createThemeColorSelection('base-200')),
          itemBackgroundColor: normalizeThemeColorSelection(parsed.basketsPage.itemBackgroundColor, fallback.basketsPage.itemBackgroundColor || createThemeColorSelection('base-200'))
        }
      : fallback.basketsPage,
    newsPage: isObject(parsed.newsPage)
      ? {
          title: normalizeLocalizedText(parsed.newsPage.title),
          subtitle: normalizeLocalizedText(parsed.newsPage.subtitle),
          containerWidth: typeof parsed.newsPage.containerWidth === 'string'
            ? parsed.newsPage.containerWidth as CmsSiteSettings['newsPage']['containerWidth']
            : fallback.newsPage.containerWidth,
          defaultViewMode: parsed.newsPage.defaultViewMode === 'list' ? 'list' : fallback.newsPage.defaultViewMode,
          gridColumns: normalizeGridColumns(parsed.newsPage.gridColumns, fallback.newsPage.gridColumns, 3) as 1 | 2 | 3,
          showSort: typeof parsed.newsPage.showSort === 'boolean' ? parsed.newsPage.showSort : fallback.newsPage.showSort,
          showViewToggle: typeof parsed.newsPage.showViewToggle === 'boolean' ? parsed.newsPage.showViewToggle : fallback.newsPage.showViewToggle,
          showCoverImage: typeof parsed.newsPage.showCoverImage === 'boolean' ? parsed.newsPage.showCoverImage : fallback.newsPage.showCoverImage,
          showPublishedDate: typeof parsed.newsPage.showPublishedDate === 'boolean' ? parsed.newsPage.showPublishedDate : fallback.newsPage.showPublishedDate,
          showExcerpt: typeof parsed.newsPage.showExcerpt === 'boolean' ? parsed.newsPage.showExcerpt : fallback.newsPage.showExcerpt,
          excerptLines: [2, 3, 4].includes(Number(parsed.newsPage.excerptLines))
            ? Number(parsed.newsPage.excerptLines) as 2 | 3 | 4
            : fallback.newsPage.excerptLines,
          cardBackgroundColor: normalizeThemeColorSelection(parsed.newsPage.cardBackgroundColor, fallback.newsPage.cardBackgroundColor || createThemeColorSelection('base-200'))
        }
      : fallback.newsPage
  }
}

export async function saveCmsSiteSettings(settings: CmsSiteSettings) {
  await setSetting(SETTING_KEYS.CMS_SITE_SETTINGS, JSON.stringify(settings))
}

export async function listCmsPages() {
  await ensureCmsSystemPages()
  const rows = await withCmsTableFallback(() => prisma.cmsPage.findMany({
    orderBy: [
      { path: 'asc' }
    ]
  }), async () => [])

  return rows.map((row) => ({
    id: row.id,
    ...pageRowToPayload(row)
  }))
}

export async function getCmsPageById(id: number) {
  const row = await withCmsTableFallback(
    () => prisma.cmsPage.findUnique({ where: { id } }),
    async () => null
  )
  return row ? { id: row.id, ...pageRowToPayload(row) } : null
}

export async function getCmsPageByPath(path: string) {
  const normalizedPath = normalizePath(path)
  const row = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({ where: { path: normalizedPath } }),
    async () => null
  )
  return row ? { id: row.id, ...pageRowToPayload(row) } : null
}

export async function ensureCmsRootPage() {
  const existing = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({ where: { path: '/' } }),
    async () => null
  )

  if (existing) {
    return existing.id
  }

  const rootPageContent = await getPageBuilderContent()
  const created = await saveCmsPage(null, {
    ...createDefaultCmsPagePayload('/', 'Accueil'),
    path: '/',
    slug: 'home',
    status: 'PUBLISHED',
    title: 'Accueil',
    translations: {
      fr: {
        title: 'Accueil',
        navigationLabel: 'Accueil',
        seo: {
          metaTitle: 'Légumes bio, paniers et vente à la ferme',
          metaDescription: 'Découvrez les légumes bio de saison, la vente à la ferme et la réservation de paniers à la Ferme du Campeyrigoux.',
          ogImage: '',
          noindex: false
        },
        content: rootPageContent
      },
      en: {
        title: 'Home',
        navigationLabel: 'Home',
        seo: {
          metaTitle: 'Organic vegetables, baskets and farm pickup',
          metaDescription: 'Discover seasonal organic vegetables, farm pickup and local basket reservations at Ferme du Campeyrigoux.',
          ogImage: '',
          noindex: false
        },
        content: rootPageContent
      }
    }
  })

  return created?.id ?? null
}

async function ensureCmsApplicationPage(path: string, slug: string, titleFr: string, titleEn: string, rendererKey: string) {
  const existing = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({ where: { path } }),
    async () => null
  )

  if (existing) {
    return existing.id
  }

  const created = await saveCmsPage(null, {
    ...createDefaultCmsPagePayload(path, titleFr),
    path,
    slug,
    pageType: 'APPLICATION',
    status: 'PUBLISHED',
    rendererKey,
    title: titleFr,
    translations: {
      fr: {
        title: titleFr,
        navigationLabel: titleFr,
        seo: createEmptyCmsPageSeo(),
        content: createEmptyPageBuilderContent()
      },
      en: {
        title: titleEn,
        navigationLabel: titleEn,
        seo: createEmptyCmsPageSeo(),
        content: createEmptyPageBuilderContent()
      }
    }
  })

  return created?.id ?? null
}

export async function ensureCmsSystemPages() {
  await ensureCmsRootPage()
  await ensureCmsApplicationPage('/paniers', 'paniers', 'Paniers', 'Baskets', 'baskets')
  await ensureCmsApplicationPage('/news', 'news', 'Actualités', 'News', 'news')
}

export async function bootstrapCmsPageFromResolvedPage(resolvedPage: ResolvedCmsPage, locale: CmsLocale) {
  if (resolvedPage.path === '/') {
    const id = await ensureCmsRootPage()
    return id ? await getCmsPageById(id) : null
  }

  if (resolvedPage.path === '/paniers' || resolvedPage.path === '/news') {
    await ensureCmsSystemPages()
    return await getCmsPageByPath(resolvedPage.path)
  }

  const existing = await getCmsPageByPath(resolvedPage.path)
  if (existing) return existing

  const payload = createDefaultCmsPagePayload(resolvedPage.path, resolvedPage.title)
  payload.status = resolvedPage.status
  payload.pageType = resolvedPage.pageType
  payload.templateKey = resolvedPage.templateKey
  payload.rendererKey = resolvedPage.rendererKey
  payload.applicationPosition = resolvedPage.applicationPosition
  payload.title = resolvedPage.title
  payload.translations[locale] = {
    title: resolvedPage.title,
    navigationLabel: resolvedPage.navigationLabel,
    seo: resolvedPage.seo,
    content: resolvedPage.content
  }

  const created = await saveCmsPage(null, payload)
  return created ? { id: created.id, ...pageRowToPayload(created) } : null
}

export async function saveCmsPage(id: number | null, payload: CmsPagePayload) {
  const normalizedPath = normalizePath(payload.path)
  const data = {
    path: normalizedPath,
    slug: payload.slug,
    title: payload.title,
    pageType: payload.pageType,
    status: payload.status,
    templateKey: payload.templateKey || 'default',
    rendererKey: payload.rendererKey || null,
    applicationPosition: payload.applicationPosition,
    translationsJson: JSON.stringify(payload.translations)
  }

  if (id) {
    const existing = await withCmsTableFallback(
      () => prisma.cmsPage.findUnique({ where: { id } }),
      async () => null
    )
    if (!existing) return null

    return await withCmsTableFallback(
      () => prisma.cmsPage.update({
        where: { id },
        data
      }),
      async () => null
    )
  }

  return await withCmsTableFallback(
    () => prisma.cmsPage.create({
      data
    }),
    async () => null
  )
}

export async function deleteCmsPage(id: number) {
  await withCmsTableFallback(async () => {
    await prisma.cmsNavigationItem.updateMany({
      where: { pageId: id },
      data: { pageId: null }
    })

    await prisma.cmsPage.delete({
      where: { id }
    })
  }, async () => undefined)
}

export async function duplicateCmsPage(id: number) {
  const existing = await getCmsPageById(id)
  if (!existing) return null

  const allPages = await listCmsPages()
  const existingPaths = new Set(allPages.map(page => page.path))
  const existingSlugs = new Set(allPages.map(page => page.slug))

  let path = `${existing.path}-copie`.replace(/\/+/g, '/')
  if (path === '//') path = '/copie'
  let slug = `${existing.slug}-copie`
  let suffix = 2

  while (existingPaths.has(path)) {
    path = `${existing.path}-copie-${suffix}`.replace(/\/+/g, '/')
    suffix += 1
  }

  suffix = 2
  while (existingSlugs.has(slug)) {
    slug = `${existing.slug}-copie-${suffix}`
    suffix += 1
  }

  return await saveCmsPage(null, {
    ...existing,
    path,
    slug,
    title: `${existing.title} (copie)`
  })
}

export async function listCmsNavigationItems(menu?: CmsNavigationMenu) {
  const rows = await withCmsTableFallback(() => prisma.cmsNavigationItem.findMany({
    where: menu ? { menu } : undefined,
    orderBy: [
      { menu: 'asc' },
      { position: 'asc' },
      { id: 'asc' }
    ]
  }), async () => [])

  if (!rows.length) {
    return mergeMissingDefaultNavigationItems(
      createDefaultCmsNavigationItems()
        .filter((item) => !menu || item.menu === menu)
        .map((item) => ({
          id: null,
          ...item
        })),
      menu
    )
  }

  return mergeMissingDefaultNavigationItems(rows.map((row) => ({
    id: row.id,
    ...navigationRowToPayload(row)
  })), menu)
}

export async function saveCmsNavigationItems(items: Array<CmsNavigationItemPayload & { id?: number | null }>) {
  const cmsTablesAvailable = await withCmsTableFallback(
    async () => {
      await prisma.cmsNavigationItem.findFirst({ select: { id: true } })
      return true
    },
    async () => false
  )

  if (!cmsTablesAvailable) {
    return
  }

  const existingIds = new Set<number>()

  for (const [index, item] of items.entries()) {
    const data = {
      menu: item.menu,
      itemType: item.itemType,
      title: item.title,
      labelsJson: JSON.stringify(item.labels),
      href: item.href,
      pageId: item.pageId,
      newTab: item.newTab,
      visible: item.visible,
      position: item.position ?? index
    }

    if (item.id) {
      existingIds.add(item.id)
      await prisma.cmsNavigationItem.update({
        where: { id: item.id },
        data
      })
    } else {
      const created = await prisma.cmsNavigationItem.create({ data })
      existingIds.add(created.id)
    }
  }

  const allRows = await prisma.cmsNavigationItem.findMany({
    select: { id: true }
  })
  const staleIds = allRows.map((row) => row.id).filter((id) => !existingIds.has(id))
  if (staleIds.length) {
    await prisma.cmsNavigationItem.deleteMany({
      where: { id: { in: staleIds } }
    })
  }
}

async function getResolvedNavigation(menu: CmsNavigationMenu, locale: string) {
  const rows = await withCmsTableFallback(() => prisma.cmsNavigationItem.findMany({
    where: {
      menu,
      visible: true
    },
    orderBy: [
      { position: 'asc' },
      { id: 'asc' }
    ]
  }), async () => [])

  if (!rows.length) {
    return mergeMissingDefaultNavigationItems(
      createDefaultCmsNavigationItems()
        .filter((item) => item.menu === menu && item.visible)
        .map((item) => ({ id: null, ...item })),
      menu
    ).map((row, index) => navigationPayloadToResolved(row.id ?? -(index + 1), row, locale))
  }

  return mergeMissingDefaultNavigationItems(
    rows.map((row) => ({ id: row.id, ...navigationRowToPayload(row) })),
    menu
  ).map((row, index) => navigationPayloadToResolved(row.id ?? -(index + 1), row, locale))
}

export async function getPublicSiteShell(locale: string): Promise<PublicSiteShell> {
  const [settings, primary, footer] = await Promise.all([
    getCmsSiteSettings(),
    getResolvedNavigation('PRIMARY', locale),
    getResolvedNavigation('FOOTER', locale)
  ])

  return {
    settings,
    navigation: {
      primary: primary.sort((a, b) => a.position - b.position),
      footer: footer.sort((a, b) => a.position - b.position)
    }
  }
}

export async function resolvePublicCmsPage(path: string, locale: string, includeDraft = false): Promise<ResolvedCmsPage | null> {
  const normalizedPath = normalizePath(path)
  const where = includeDraft
    ? { path: normalizedPath }
    : { path: normalizedPath, status: 'PUBLISHED' as const }

  const row = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({ where }),
    async () => null
  )

  if (row) {
    const payload = pageRowToPayload(row)
    const localized = pickTranslation(locale, payload.translations)

    return {
      id: row.id,
      path: payload.path,
      slug: payload.slug,
      pageType: payload.pageType,
      status: payload.status,
      templateKey: payload.templateKey,
      rendererKey: payload.rendererKey,
      applicationPosition: payload.applicationPosition,
      title: localized.title || payload.title,
      navigationLabel: localized.navigationLabel || localized.title || payload.title,
      seo: localized.seo,
      content: localized.content
    }
  }

  if (normalizedPath === '/') {
    return await createLegacyRootResolvedPage(locale)
  }

  if (normalizedPath === '/paniers') {
    return createLegacyBasketsResolvedPage(locale)
  }

  if (normalizedPath === '/news') {
    return createLegacyNewsResolvedPage(locale)
  }

  return null
}

export function validateCmsPagePayload(value: unknown): CmsPagePayload {
  if (!isObject(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payload CMS invalide'
    })
  }

  const path = normalizePath(typeof value.path === 'string' ? value.path : '/')
  const fallback = createDefaultCmsPagePayload(path, typeof value.title === 'string' ? value.title : '')

  const pageType = typeof value.pageType === 'string' ? value.pageType : fallback.pageType
  const status = typeof value.status === 'string' ? value.status : fallback.status
  const applicationPosition = typeof value.applicationPosition === 'string'
    ? value.applicationPosition
    : fallback.applicationPosition

  return {
    path,
    slug: typeof value.slug === 'string' ? value.slug.trim() : fallback.slug,
    pageType: isCmsPageType(pageType) ? pageType : fallback.pageType,
    status: isCmsPageStatus(status) ? status : fallback.status,
    templateKey: typeof value.templateKey === 'string' && value.templateKey.trim() ? value.templateKey.trim() : fallback.templateKey,
    rendererKey: typeof value.rendererKey === 'string' ? value.rendererKey.trim() : '',
    applicationPosition: isCmsApplicationPosition(applicationPosition) ? applicationPosition : fallback.applicationPosition,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : fallback.title,
    translations: normalizeTranslations(value.translations, path)
  }
}

export function validateCmsSiteSettingsPayload(value: unknown): CmsSiteSettings {
  if (!isObject(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Configuration du site invalide'
    })
  }

  const fallback = createDefaultCmsSiteSettings()
  const logoValue = isObject(value.logo) ? value.logo : {}
  const faviconValue = isObject(value.favicon) ? value.favicon : {}
  const headerValue = isObject(value.header) ? value.header : {}
  const footerValue = isObject(value.footer) ? value.footer : {}
  const basketsPageValue = isObject(value.basketsPage) ? value.basketsPage : {}
  const newsPageValue = isObject(value.newsPage) ? value.newsPage : {}

  return {
    siteName: normalizeLocalizedText(value.siteName),
    siteTagline: normalizeLocalizedText(value.siteTagline),
    logo: normalizeImageAsset(logoValue, fallback.logo),
    favicon: normalizeImageAsset(faviconValue, fallback.favicon),
    header: {
      heightPx: typeof headerValue.heightPx === 'number' ? Math.max(56, Math.min(180, Math.round(headerValue.heightPx))) : fallback.header.heightPx,
      logoHeightPx: typeof headerValue.logoHeightPx === 'number' ? Math.max(24, Math.min(140, Math.round(headerValue.logoHeightPx))) : fallback.header.logoHeightPx,
      mobileLogoHeightPx: typeof headerValue.mobileLogoHeightPx === 'number' ? Math.max(24, Math.min(120, Math.round(headerValue.mobileLogoHeightPx))) : fallback.header.mobileLogoHeightPx,
      showSiteName: typeof headerValue.showSiteName === 'boolean' ? headerValue.showSiteName : fallback.header.showSiteName,
      showSiteTagline: typeof headerValue.showSiteTagline === 'boolean' ? headerValue.showSiteTagline : fallback.header.showSiteTagline,
      showPrimaryNavigation: typeof headerValue.showPrimaryNavigation === 'boolean' ? headerValue.showPrimaryNavigation : fallback.header.showPrimaryNavigation,
      backgroundColor: normalizeThemeColorSelection(headerValue.backgroundColor, fallback.header.backgroundColor || createThemeColorSelection('base-100')),
      textColor: normalizeThemeColorSelection(headerValue.textColor, fallback.header.textColor || createThemeColorSelection('base-content')),
      sticky: typeof headerValue.sticky === 'boolean' ? headerValue.sticky : fallback.header.sticky
    },
    footer: {
      columns: normalizeFooterColumns(footerValue.columns),
      containerWidth: typeof footerValue.containerWidth === 'string' ? footerValue.containerWidth as CmsSiteSettings['footer']['containerWidth'] : fallback.footer.containerWidth,
      containerAlign: footerValue.containerAlign === 'start' || footerValue.containerAlign === 'center' || footerValue.containerAlign === 'between'
        ? footerValue.containerAlign
        : fallback.footer.containerAlign,
      backgroundColor: normalizeThemeColorSelection(footerValue.backgroundColor, fallback.footer.backgroundColor || createThemeColorSelection('neutral')),
      textColor: normalizeThemeColorSelection(footerValue.textColor, fallback.footer.textColor || createThemeColorSelection('neutral-content')),
      copyright: normalizeLocalizedText(footerValue.copyright)
    },
    socialLinks: Array.isArray(value.socialLinks)
      ? value.socialLinks
          .filter(isObject)
          .map((link, index) => ({
            id: typeof link.id === 'string' ? link.id : `social-${index + 1}`,
            label: normalizeLocalizedText(link.label),
            href: typeof link.href === 'string' ? link.href.trim() : '',
            icon: typeof link.icon === 'string' ? link.icon.trim() : ''
          }))
          .filter((link) => Boolean(link.href))
      : fallback.socialLinks,
    basketsPage: {
      title: normalizeLocalizedText(basketsPageValue.title),
      subtitle: normalizeLocalizedText(basketsPageValue.subtitle),
      containerWidth: typeof basketsPageValue.containerWidth === 'string' ? basketsPageValue.containerWidth as CmsSiteSettings['basketsPage']['containerWidth'] : fallback.basketsPage.containerWidth,
      gridColumns: normalizeGridColumns(basketsPageValue.gridColumns, fallback.basketsPage.gridColumns, 4),
      showOrdersBanner: typeof basketsPageValue.showOrdersBanner === 'boolean' ? basketsPageValue.showOrdersBanner : fallback.basketsPage.showOrdersBanner,
      showDescriptions: typeof basketsPageValue.showDescriptions === 'boolean' ? basketsPageValue.showDescriptions : fallback.basketsPage.showDescriptions,
      showComposition: typeof basketsPageValue.showComposition === 'boolean' ? basketsPageValue.showComposition : fallback.basketsPage.showComposition,
      showImages: typeof basketsPageValue.showImages === 'boolean' ? basketsPageValue.showImages : fallback.basketsPage.showImages,
      showAvailabilityBadges: typeof basketsPageValue.showAvailabilityBadges === 'boolean' ? basketsPageValue.showAvailabilityBadges : fallback.basketsPage.showAvailabilityBadges,
      showPrice: typeof basketsPageValue.showPrice === 'boolean' ? basketsPageValue.showPrice : fallback.basketsPage.showPrice,
      cardBackgroundColor: normalizeThemeColorSelection(basketsPageValue.cardBackgroundColor, fallback.basketsPage.cardBackgroundColor || createThemeColorSelection('base-200')),
      itemBackgroundColor: normalizeThemeColorSelection(basketsPageValue.itemBackgroundColor, fallback.basketsPage.itemBackgroundColor || createThemeColorSelection('base-200'))
    },
    newsPage: {
      title: normalizeLocalizedText(newsPageValue.title),
      subtitle: normalizeLocalizedText(newsPageValue.subtitle),
      containerWidth: typeof newsPageValue.containerWidth === 'string' ? newsPageValue.containerWidth as CmsSiteSettings['newsPage']['containerWidth'] : fallback.newsPage.containerWidth,
      defaultViewMode: newsPageValue.defaultViewMode === 'list' ? 'list' : fallback.newsPage.defaultViewMode,
      gridColumns: normalizeGridColumns(newsPageValue.gridColumns, fallback.newsPage.gridColumns, 3) as 1 | 2 | 3,
      showSort: typeof newsPageValue.showSort === 'boolean' ? newsPageValue.showSort : fallback.newsPage.showSort,
      showViewToggle: typeof newsPageValue.showViewToggle === 'boolean' ? newsPageValue.showViewToggle : fallback.newsPage.showViewToggle,
      showCoverImage: typeof newsPageValue.showCoverImage === 'boolean' ? newsPageValue.showCoverImage : fallback.newsPage.showCoverImage,
      showPublishedDate: typeof newsPageValue.showPublishedDate === 'boolean' ? newsPageValue.showPublishedDate : fallback.newsPage.showPublishedDate,
      showExcerpt: typeof newsPageValue.showExcerpt === 'boolean' ? newsPageValue.showExcerpt : fallback.newsPage.showExcerpt,
      excerptLines: [2, 3, 4].includes(Number(newsPageValue.excerptLines))
        ? Number(newsPageValue.excerptLines) as 2 | 3 | 4
        : fallback.newsPage.excerptLines,
      cardBackgroundColor: normalizeThemeColorSelection(newsPageValue.cardBackgroundColor, fallback.newsPage.cardBackgroundColor || createThemeColorSelection('base-200'))
    }
  }
}

export function validateCmsNavigationItemsPayload(value: unknown): Array<CmsNavigationItemPayload & { id?: number | null }> {
  if (!Array.isArray(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Navigation CMS invalide'
    })
  }

  return value
    .filter(isObject)
    .map((item, index) => ({
      id: typeof item.id === 'number' ? item.id : null,
      menu: isCmsNavigationMenu(item.menu) ? item.menu : 'PRIMARY',
      itemType: isCmsNavigationItemType(item.itemType) ? item.itemType : 'APPLICATION_ROUTE',
      title: typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Lien ${index + 1}`,
      labels: normalizeLocalizedText(item.labels),
      href: typeof item.href === 'string' && item.href.trim() ? item.href.trim() : '/',
      pageId: typeof item.pageId === 'number' ? item.pageId : null,
      newTab: typeof item.newTab === 'boolean' ? item.newTab : false,
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      position: typeof item.position === 'number' ? item.position : index
    }))
}

const CMS_PAGE_TYPES = new Set<CmsPageType>(['CMS', 'APPLICATION', 'HYBRID'])
const CMS_PAGE_STATUSES = new Set<CmsPageStatus>(['DRAFT', 'PUBLISHED'])
const CMS_APPLICATION_POSITIONS = new Set<CmsApplicationPosition>(['BEFORE_CONTENT', 'AFTER_CONTENT'])
const CMS_NAVIGATION_MENUS = new Set<CmsNavigationMenu>(['PRIMARY', 'FOOTER'])
const CMS_NAVIGATION_ITEM_TYPES = new Set<CmsNavigationItemType>(['CMS_PAGE', 'APPLICATION_ROUTE', 'EXTERNAL_URL'])
