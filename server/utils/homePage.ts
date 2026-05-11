import type {
  CardsDisplay,
  HomePageButton,
  HomePageCard,
  HomePageColumn,
  HomePageColumnItem,
  HomePageContent,
  HomePageSection,
  ThemeColorSelection,
  ThemeColorToken
} from '~/shared/homePage'
import {
  createBadgeItem,
  createButtonsItem,
  createCardsItem,
  createCarouselItem,
  createDefaultHomePageContent,
  createEmptyCard,
  createEmptyColumnsSection,
  createEmptyContentBlock,
  createEmptySectionBackgroundCarouselSettings,
  createEmptySectionBackgroundImage,
  createEmptySectionBackgroundSlide,
  createImageItem,
  createTextItem,
  createTitleItem,
  isValidIconifyName,
  THEME_COLOR_TOKENS
} from '~/shared/homePage'
import { getFarmPickupConfig, getSetting, setSetting, SETTING_KEYS } from './settings'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeLocalizedText(value: unknown) {
  if (!isObject(value)) return null
  return {
    fr: typeof value.fr === 'string' ? value.fr : '',
    en: typeof value.en === 'string' ? value.en : ''
  }
}

function sanitizeThemeColorToken(value: unknown, fallback: ThemeColorToken) {
  if (typeof value !== 'string') return fallback
  return THEME_COLOR_TOKENS.includes(value as ThemeColorToken) ? value as ThemeColorToken : fallback
}

function sanitizeHexColor(value: unknown) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim()
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized) ? normalized : ''
}

function sanitizeOpacity(value: unknown, fallback = 100) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.min(100, Math.round(value)))
}

function sanitizeSectionMinHeight(value: unknown) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const normalized = Math.max(0, Math.min(2400, Math.round(value)))
  return normalized > 0 ? normalized : null
}

function normalizeThemeColorSelection(value: unknown, fallbackToken: ThemeColorToken = 'primary'): ThemeColorSelection | null {
  if (!isObject(value)) return null
  return {
    token: sanitizeThemeColorToken(value.token, fallbackToken),
    customHex: sanitizeHexColor(value.customHex),
    opacity: sanitizeOpacity(value.opacity)
  }
}

function normalizeButton(value: unknown): HomePageButton | null {
  if (!isObject(value)) return null
  const label = normalizeLocalizedText(value.label)
  if (!label || typeof value.href !== 'string') return null
  return {
    label,
    href: value.href,
    tone: (typeof value.tone === 'string' ? value.tone : 'primary') as HomePageButton['tone'],
    size: (typeof value.size === 'string' ? value.size : 'md') as HomePageButton['size'],
    backgroundColor: normalizeThemeColorSelection(value.backgroundColor, 'primary'),
    textColor: normalizeThemeColorSelection(value.textColor, 'primary-content'),
    borderColor: normalizeThemeColorSelection(value.borderColor, 'transparent')
  }
}

function sanitizeIconName(value: unknown) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim()
  return normalized && isValidIconifyName(normalized) ? normalized : ''
}

function normalizeCard(value: unknown): HomePageCard | null {
  if (!isObject(value)) return null
  const title = normalizeLocalizedText(value.title)
  const text = normalizeLocalizedText(value.text)
  if (!title || !text) return null
  return {
    id: typeof value.id === 'string' ? value.id : `card-${Math.random().toString(36).slice(2, 8)}`,
    title,
    text,
    icon: sanitizeIconName(value.icon),
    tone: (typeof value.tone === 'string' ? value.tone : 'soft') as HomePageCard['tone'],
    size: (typeof value.size === 'string' ? value.size : 'md') as HomePageCard['size'],
    titleSize: (typeof value.titleSize === 'string' ? value.titleSize : 'md') as HomePageCard['titleSize'],
    textSize: (typeof value.textSize === 'string' ? value.textSize : 'sm') as HomePageCard['textSize'],
    backgroundColor: normalizeThemeColorSelection(value.backgroundColor, 'base-200'),
    textColor: normalizeThemeColorSelection(value.textColor, 'base-content'),
    iconColor: normalizeThemeColorSelection(value.iconColor, 'primary'),
    iconBackgroundColor: normalizeThemeColorSelection(value.iconBackgroundColor, 'transparent'),
    borderColor: normalizeThemeColorSelection(value.borderColor, 'base-300'),
    backdropBlur: typeof value.backdropBlur === 'boolean' ? value.backdropBlur : false,
    primaryButton: normalizeButton(value.primaryButton),
    secondaryButton: normalizeButton(value.secondaryButton)
  }
}

function normalizeColumnItem(value: unknown): HomePageColumnItem | null {
  if (!isObject(value) || typeof value.type !== 'string') return null

  switch (value.type) {
    case 'badge': {
      const text = normalizeLocalizedText(value.text)
      if (!text) return null
      const item = createBadgeItem(typeof value.id === 'string' ? value.id : `badge-${Math.random().toString(36).slice(2, 8)}`)
      item.text = text
      item.size = (typeof value.size === 'string' ? value.size : 'sm') as typeof item.size
      item.backgroundColor = normalizeThemeColorSelection(value.backgroundColor, 'primary')
      item.textColor = normalizeThemeColorSelection(value.textColor, 'primary-content')
      item.borderColor = normalizeThemeColorSelection(value.borderColor, 'primary')
      return item
    }
    case 'title': {
      const text = normalizeLocalizedText(value.text)
      if (!text) return null
      const item = createTitleItem(typeof value.id === 'string' ? value.id : `title-${Math.random().toString(36).slice(2, 8)}`)
      item.text = text
      item.size = (typeof value.size === 'string' ? value.size : 'xl') as typeof item.size
      return item
    }
    case 'text': {
      const text = normalizeLocalizedText(value.text)
      if (!text) return null
      const item = createTextItem(typeof value.id === 'string' ? value.id : `text-${Math.random().toString(36).slice(2, 8)}`)
      item.text = text
      item.size = (typeof value.size === 'string' ? value.size : 'md') as typeof item.size
      return item
    }
    case 'buttons': {
      const item = createButtonsItem(typeof value.id === 'string' ? value.id : `buttons-${Math.random().toString(36).slice(2, 8)}`)
      item.primaryButton = normalizeButton(value.primaryButton)
      item.secondaryButton = normalizeButton(value.secondaryButton)
      return item
    }
    case 'cards': {
      const item = createCardsItem(typeof value.id === 'string' ? value.id : `cards-${Math.random().toString(36).slice(2, 8)}`)
      item.display = (typeof value.display === 'string' ? value.display : 'stack') as CardsDisplay
      item.cards = Array.isArray(value.cards) ? value.cards.map(normalizeCard).filter((card): card is HomePageCard => Boolean(card)) : []
      return item
    }
    case 'image': {
      const item = createImageItem(typeof value.id === 'string' ? value.id : `image-${Math.random().toString(36).slice(2, 8)}`)
      item.imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl : ''
      item.alt = normalizeLocalizedText(value.alt) || item.alt
      item.aspect = (typeof value.aspect === 'string' ? value.aspect : 'landscape') as typeof item.aspect
      item.fit = (typeof value.fit === 'string' ? value.fit : 'cover') as typeof item.fit
      item.verticalAlign = (typeof value.verticalAlign === 'string' ? value.verticalAlign : 'center') as typeof item.verticalAlign
      item.enlarge = typeof value.enlarge === 'boolean' ? value.enlarge : false
      item.framed = typeof value.framed === 'boolean' ? value.framed : true
      return item
    }
    case 'carousel': {
      const item = createCarouselItem(typeof value.id === 'string' ? value.id : `carousel-${Math.random().toString(36).slice(2, 8)}`)
      item.aspect = (typeof value.aspect === 'string' ? value.aspect : 'landscape') as typeof item.aspect
      item.framed = typeof value.framed === 'boolean' ? value.framed : true
      item.slides = normalizeSectionBackgroundSlides(value.slides, item.id)
      item.settings = normalizeCarouselSettings(value.settings)
      return item
    }
    default:
      return null
  }
}

function normalizeCarouselSettings(value: unknown) {
  const settings = createEmptySectionBackgroundCarouselSettings()
  if (!isObject(value)) return settings
  settings.autoplay = typeof value.autoplay === 'boolean' ? value.autoplay : settings.autoplay
  settings.infinite = typeof value.infinite === 'boolean' ? value.infinite : settings.infinite
  settings.intervalMs = typeof value.intervalMs === 'number' && Number.isFinite(value.intervalMs)
    ? Math.max(1500, Math.min(30000, Math.round(value.intervalMs)))
    : settings.intervalMs
  settings.showArrows = typeof value.showArrows === 'boolean' ? value.showArrows : settings.showArrows
  settings.showDots = typeof value.showDots === 'boolean' ? value.showDots : settings.showDots
  settings.animation = (typeof value.animation === 'string' ? value.animation : settings.animation) as typeof settings.animation
  return settings
}

function normalizeSectionBackgroundImage(value: unknown) {
  const background = createEmptySectionBackgroundImage()
  if (!isObject(value)) return background
  background.imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl : ''
  background.alt = normalizeLocalizedText(value.alt) || background.alt
  background.fit = (typeof value.fit === 'string' ? value.fit : 'cover') as typeof background.fit
  background.verticalAlign = (typeof value.verticalAlign === 'string' ? value.verticalAlign : 'center') as typeof background.verticalAlign
  background.overlayColor = normalizeThemeColorSelection(value.overlayColor, 'neutral')
  background.overlayOpacity = sanitizeOpacity(value.overlayOpacity, 35)
  background.blur = typeof value.blur === 'boolean' ? value.blur : false
  return background
}

function normalizeSectionBackgroundSlides(value: unknown, sectionId: string) {
  if (!Array.isArray(value)) {
    return [createEmptySectionBackgroundSlide(`${sectionId}-slide-1`)]
  }

  const slides = value
    .map((entry, index) => {
      if (!isObject(entry)) return null
      const slide = createEmptySectionBackgroundSlide(
        typeof entry.id === 'string' ? entry.id : `${sectionId}-slide-${index + 1}`
      )
      slide.imageUrl = typeof entry.imageUrl === 'string' ? entry.imageUrl : ''
      slide.alt = normalizeLocalizedText(entry.alt) || slide.alt
      slide.fit = (typeof entry.fit === 'string' ? entry.fit : 'cover') as typeof slide.fit
      slide.verticalAlign = (typeof entry.verticalAlign === 'string' ? entry.verticalAlign : 'center') as typeof slide.verticalAlign
      return slide
    })
    .filter((slide): slide is ReturnType<typeof createEmptySectionBackgroundSlide> => Boolean(slide))

  return slides.length ? slides : [createEmptySectionBackgroundSlide(`${sectionId}-slide-1`)]
}

function migrateLegacyItems(value: Record<string, unknown>) {
  const items: HomePageColumnItem[] = []
  const badge = normalizeLocalizedText(value.badge)
  if (badge && (badge.fr || badge.en)) {
    const item = createBadgeItem(`badge-${Math.random().toString(36).slice(2, 8)}`)
    item.text = badge
    item.size = (typeof value.badgeSize === 'string' ? value.badgeSize : 'sm') as typeof item.size
    items.push(item)
  }
  const title = normalizeLocalizedText(value.title)
  if (title && (title.fr || title.en)) {
    const item = createTitleItem(`title-${Math.random().toString(36).slice(2, 8)}`)
    item.text = title
    item.size = (typeof value.titleSize === 'string' ? value.titleSize : 'xl') as typeof item.size
    items.push(item)
  }
  const text = normalizeLocalizedText(value.text)
  if (text && (text.fr || text.en)) {
    const item = createTextItem(`text-${Math.random().toString(36).slice(2, 8)}`)
    item.text = text
    item.size = (typeof value.textSize === 'string' ? value.textSize : 'md') as typeof item.size
    items.push(item)
  }
  const cards = Array.isArray(value.cards) ? value.cards.map(normalizeCard).filter((card): card is HomePageCard => Boolean(card)) : []
  if (cards.length) {
    const item = createCardsItem(`cards-${Math.random().toString(36).slice(2, 8)}`)
    item.cards = cards
    item.display = 'grid-2'
    items.push(item)
  }
  const primaryButton = normalizeButton(value.primaryButton)
  const secondaryButton = normalizeButton(value.secondaryButton)
  if (primaryButton || secondaryButton) {
    const item = createButtonsItem(`buttons-${Math.random().toString(36).slice(2, 8)}`)
    item.primaryButton = primaryButton
    item.secondaryButton = secondaryButton
    items.push(item)
  }
  return items
}

function normalizeColumn(value: unknown): HomePageColumn | null {
  if (!isObject(value)) return null

  if (typeof value.type === 'string' && value.type === 'image') {
    const column = createEmptyContentBlock()
    column.items = [normalizeColumnItem({ ...value, type: 'image' })!].filter(Boolean)
    return column
  }

  const column = createEmptyContentBlock()
  column.align = (typeof value.align === 'string' ? value.align : 'start') as HomePageColumn['align']
  column.verticalAlign = (typeof value.verticalAlign === 'string' ? value.verticalAlign : 'center') as HomePageColumn['verticalAlign']
  column.textColor = normalizeThemeColorSelection(value.textColor, 'base-content')
  column.items = Array.isArray(value.items)
    ? value.items.map(normalizeColumnItem).filter((item): item is HomePageColumnItem => Boolean(item))
    : migrateLegacyItems(value)
  return column
}

function heroToSection(hero: Record<string, unknown>): HomePageSection | null {
  const section = createEmptyColumnsSection('migrated-hero', 1)
  const column = section.columns[0]
  if (!column) return null
  section.backgroundMode = 'image'
  section.backgroundImage = normalizeSectionBackgroundImage({
    imageUrl: hero.backgroundImageUrl,
    fit: 'cover',
    verticalAlign: 'center',
    overlayColor: { token: 'neutral', opacity: 100 },
    overlayOpacity: 55,
    blur: false
  })
  column.textColor = { token: 'white', opacity: 100 }

  const badge = normalizeLocalizedText(hero.badge)
  if (badge && (badge.fr || badge.en)) {
    const item = createBadgeItem('hero-badge')
    item.text = badge
    item.size = (typeof hero.badgeSize === 'string' ? hero.badgeSize : 'sm') as typeof item.size
    column.items.push(item)
  }

  const title = normalizeLocalizedText(hero.title)
  if (title && (title.fr || title.en)) {
    const item = createTitleItem('hero-title')
    item.text = title
    item.size = (typeof hero.titleSize === 'string' ? hero.titleSize : '2xl') as typeof item.size
    column.items.push(item)
  }

  const text = normalizeLocalizedText(hero.text)
  if (text && (text.fr || text.en)) {
    const item = createTextItem('hero-text')
    item.text = text
    item.size = (typeof hero.textSize === 'string' ? hero.textSize : 'lg') as typeof item.size
    column.items.push(item)
  }

  const primaryButton = normalizeButton(hero.primaryButton)
  const secondaryButton = normalizeButton(hero.secondaryButton)
  if (primaryButton || secondaryButton) {
    const item = createButtonsItem('hero-buttons')
    item.primaryButton = primaryButton
    item.secondaryButton = secondaryButton
    column.items.push(item)
  }

  const highlights = Array.isArray(hero.highlights) ? hero.highlights.map(normalizeCard).filter((card): card is HomePageCard => Boolean(card)) : []
  if (highlights.length) {
    const item = createCardsItem('hero-cards')
    item.display = 'grid-2'
    item.cards = highlights
    column.items.push(item)
  }

  return section
}

function normalizeSection(value: unknown): HomePageSection | null {
  if (!isObject(value)) return null
  const count = typeof value.columnCount === 'number'
    ? value.columnCount
    : value.type === 'one-column' ? 1 : value.type === 'two-columns' ? 2 : value.type === 'three-columns' ? 3 : value.type === 'four-columns' ? 4 : null
  if (![1, 2, 3, 4].includes(count as number)) return null

  const section = createEmptyColumnsSection(
    typeof value.id === 'string' ? value.id : `section-${Math.random().toString(36).slice(2, 8)}`,
    count as 1 | 2 | 3 | 4
  )
  section.enabled = typeof value.enabled === 'boolean' ? value.enabled : true
  section.tone = (typeof value.tone === 'string' ? value.tone : 'base-100') as HomePageSection['tone']
  section.containerWidth = (typeof value.containerWidth === 'string' ? value.containerWidth : 'default') as HomePageSection['containerWidth']
  section.contentVerticalAlign = (typeof value.contentVerticalAlign === 'string' ? value.contentVerticalAlign : 'center') as HomePageSection['contentVerticalAlign']
  section.minHeightPx = sanitizeSectionMinHeight(value.minHeightPx)
  section.backgroundColor = normalizeThemeColorSelection(value.backgroundColor, 'base-100')
  section.backgroundMode = (typeof value.backgroundMode === 'string' ? value.backgroundMode : 'none') as HomePageSection['backgroundMode']
  section.backgroundImage = normalizeSectionBackgroundImage(value.backgroundImage)
  section.backgroundCarousel = normalizeSectionBackgroundSlides(value.backgroundCarousel, section.id)
  section.backgroundCarouselSettings = normalizeCarouselSettings(value.backgroundCarouselSettings)
  section.reverseOnDesktop = typeof value.reverseOnDesktop === 'boolean' ? value.reverseOnDesktop : false

  const rawColumns = Array.isArray(value.columns)
    ? value.columns
    : isObject((value as any).column)
      ? [(value as any).column]
      : []

  const normalized = rawColumns.map(normalizeColumn).filter((column): column is HomePageColumn => Boolean(column))
  if (normalized.length) {
    section.columns = normalized.slice(0, section.columnCount)
    while (section.columns.length < section.columnCount) {
      section.columns.push(createEmptyContentBlock())
    }
  }

  return section
}

function normalizeHomePageContent(value: unknown, fallback: HomePageContent): HomePageContent {
  if (!isObject(value) || value.version !== 1) {
    return fallback
  }

  const sections = Array.isArray(value.sections)
    ? value.sections.map(normalizeSection).filter((section): section is HomePageSection => Boolean(section))
    : []

  if (isObject(value.hero)) {
    const heroSection = heroToSection(value.hero)
    if (heroSection) {
      sections.unshift(heroSection)
    }
  }

  return {
    version: 1,
    sections: sections.length ? sections : fallback.sections
  }
}

export async function getHomePageContent(): Promise<HomePageContent> {
  const farmPickup = await getFarmPickupConfig()
  const fallback = createDefaultHomePageContent(farmPickup.address)
  const raw = await getSetting(SETTING_KEYS.HOME_PAGE_CONTENT)
  if (!raw) return fallback
  try {
    return normalizeHomePageContent(JSON.parse(raw), fallback)
  } catch {
    return fallback
  }
}

export async function saveHomePageContent(content: HomePageContent) {
  const farmPickup = await getFarmPickupConfig()
  const fallback = createDefaultHomePageContent(farmPickup.address)
  const normalized = normalizeHomePageContent(content, fallback)
  await setSetting(SETTING_KEYS.HOME_PAGE_CONTENT, JSON.stringify(normalized))
}
