import { createDefaultHomePageContent, isValidIconifyName, THEME_COLOR_TOKENS, type HomePageButton, type HomePageCard, type HomePageColumn, type HomePageContent, type ThemeColorSelection, type ThemeColorToken } from '~/shared/homePage'
import { getFarmPickupConfig, getSetting, setSetting, SETTING_KEYS } from './settings'

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeLocalizedText(value: unknown) {
  if (!isObject(value)) {
    return null
  }

  return {
    fr: typeof value.fr === 'string' ? value.fr : '',
    en: typeof value.en === 'string' ? value.en : ''
  }
}

function normalizeButton(value: unknown): HomePageButton | null {
  if (!isObject(value)) {
    return null
  }

  const label = normalizeLocalizedText(value.label)
  if (!label || typeof value.href !== 'string') {
    return null
  }

  return {
    label,
    href: value.href,
    tone: (typeof value.tone === 'string' ? value.tone : 'primary') as HomePageButton['tone'],
    backgroundColor: normalizeThemeColorSelection(value.backgroundColor),
    textColor: normalizeThemeColorSelection(value.textColor),
    borderColor: normalizeThemeColorSelection(value.borderColor)
  }
}

function sanitizeIconName(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim()
  return normalized && isValidIconifyName(normalized) ? normalized : ''
}

function sanitizeThemeColorToken(value: unknown, fallback: ThemeColorToken) {
  if (typeof value !== 'string') {
    return fallback
  }

  return THEME_COLOR_TOKENS.includes(value as ThemeColorToken)
    ? value as ThemeColorToken
    : fallback
}

function sanitizeHexColor(value: unknown) {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.trim()
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized) ? normalized : ''
}

function sanitizeOpacity(value: unknown, fallback = 100) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.min(100, Math.round(value)))
}

function normalizeThemeColorSelection(value: unknown, fallbackToken: ThemeColorToken = 'primary'): ThemeColorSelection | null {
  if (!isObject(value)) {
    return null
  }

  const token = sanitizeThemeColorToken(value.token, fallbackToken)
  return {
    token,
    customHex: sanitizeHexColor(value.customHex),
    opacity: sanitizeOpacity(value.opacity)
  }
}

function normalizeCard(value: unknown): HomePageCard | null {
  if (!isObject(value)) {
    return null
  }

  const title = normalizeLocalizedText(value.title)
  const text = normalizeLocalizedText(value.text)
  if (!title || !text) {
    return null
  }

  return {
    id: typeof value.id === 'string' ? value.id : `card-${Math.random().toString(36).slice(2, 8)}`,
    title,
    text,
    icon: sanitizeIconName(value.icon),
    tone: (typeof value.tone === 'string' ? value.tone : 'soft') as HomePageCard['tone'],
    size: (typeof value.size === 'string' ? value.size : 'md') as HomePageCard['size'],
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

function normalizeColumn(value: unknown): HomePageColumn | null {
  if (!isObject(value) || typeof value.type !== 'string') {
    return null
  }

  if (value.type === 'image') {
    return {
      type: 'image' as const,
      imageUrl: typeof value.imageUrl === 'string' ? value.imageUrl : '',
      alt: normalizeLocalizedText(value.alt) || { fr: '', en: '' },
      aspect: (typeof value.aspect === 'string' ? value.aspect : 'landscape') as Extract<HomePageColumn, { type: 'image' }>['aspect'],
      fit: (typeof value.fit === 'string' ? value.fit : 'cover') as Extract<HomePageColumn, { type: 'image' }>['fit'],
      framed: typeof value.framed === 'boolean' ? value.framed : true
    }
  }

  if (value.type === 'content') {
    return {
      type: 'content' as const,
      align: (typeof value.align === 'string' ? value.align : 'start') as Extract<HomePageColumn, { type: 'content' }>['align'],
      verticalAlign: (typeof value.verticalAlign === 'string' ? value.verticalAlign : 'center') as Extract<HomePageColumn, { type: 'content' }>['verticalAlign'],
      textColor: normalizeThemeColorSelection(value.textColor, 'base-content'),
      badge: normalizeLocalizedText(value.badge) || { fr: '', en: '' },
      title: normalizeLocalizedText(value.title) || { fr: '', en: '' },
      text: normalizeLocalizedText(value.text) || { fr: '', en: '' },
      cards: Array.isArray(value.cards) ? value.cards.map(normalizeCard).filter((card): card is HomePageCard => Boolean(card)) : [],
      primaryButton: normalizeButton(value.primaryButton),
      secondaryButton: normalizeButton(value.secondaryButton)
    }
  }

  return null
}

function normalizeHomePageContent(value: unknown, fallback: HomePageContent): HomePageContent {
  if (!isObject(value) || value.version !== 1 || !isObject(value.hero) || !Array.isArray(value.sections)) {
    return fallback
  }

  const hero = value.hero
  const normalizedHero = {
    enabled: typeof hero.enabled === 'boolean' ? hero.enabled : true,
    backgroundImageUrl: typeof hero.backgroundImageUrl === 'string' ? hero.backgroundImageUrl : fallback.hero.backgroundImageUrl,
    badge: normalizeLocalizedText(hero.badge) || fallback.hero.badge,
    title: normalizeLocalizedText(hero.title) || fallback.hero.title,
    text: normalizeLocalizedText(hero.text) || fallback.hero.text,
    primaryButton: normalizeButton(hero.primaryButton) || fallback.hero.primaryButton,
    secondaryButton: normalizeButton(hero.secondaryButton),
    highlights: Array.isArray(hero.highlights)
      ? hero.highlights.map(normalizeCard).filter((card): card is HomePageCard => Boolean(card))
      : fallback.hero.highlights
  }

  const normalizedSections = value.sections
    .map((section) => {
      if (!isObject(section) || typeof section.type !== 'string') {
        return null
      }

      if (section.type === 'two-columns') {
        if (!Array.isArray(section.columns) || section.columns.length !== 2) {
          return null
        }

        const first = normalizeColumn(section.columns[0])
        const second = normalizeColumn(section.columns[1])
        if (!first || !second) {
          return null
        }

        return {
          id: typeof section.id === 'string' ? section.id : `section-${Math.random().toString(36).slice(2, 8)}`,
          type: 'two-columns' as const,
          enabled: typeof section.enabled === 'boolean' ? section.enabled : true,
          tone: (typeof section.tone === 'string' ? section.tone : 'base-100') as HomePageContent['sections'][number]['tone'],
          containerWidth: typeof section.containerWidth === 'string' ? section.containerWidth as 'narrow' | 'default' | 'wide' | 'full' : 'default',
          backgroundColor: normalizeThemeColorSelection(section.backgroundColor, 'base-100') ?? null,
          verticalAlign: typeof section.verticalAlign === 'string' ? section.verticalAlign as 'start' | 'center' | 'end' : 'center',
          reverseOnDesktop: typeof section.reverseOnDesktop === 'boolean' ? section.reverseOnDesktop : false,
          columns: [first, second] as [HomePageColumn, HomePageColumn]
        }
      }

      if (section.type === 'one-column') {
        const column = normalizeColumn(section.column)
        if (!column) {
          return null
        }

        return {
          id: typeof section.id === 'string' ? section.id : `section-${Math.random().toString(36).slice(2, 8)}`,
          type: 'one-column' as const,
          enabled: typeof section.enabled === 'boolean' ? section.enabled : true,
          tone: (typeof section.tone === 'string' ? section.tone : 'base-100') as HomePageContent['sections'][number]['tone'],
          containerWidth: typeof section.containerWidth === 'string' ? section.containerWidth as 'narrow' | 'default' | 'wide' | 'full' : 'default',
          backgroundColor: normalizeThemeColorSelection(section.backgroundColor, 'base-100') ?? null,
          verticalAlign: typeof section.verticalAlign === 'string' ? section.verticalAlign as 'start' | 'center' | 'end' : 'start',
          column
        }
      }

      return null
    })
    .filter((section): section is NonNullable<typeof section> => section !== null) as HomePageContent['sections']

  return {
    version: 1,
    hero: normalizedHero,
    sections: normalizedSections.length ? normalizedSections : fallback.sections
  }
}

export async function getHomePageContent(): Promise<HomePageContent> {
  const farmPickup = await getFarmPickupConfig()
  const fallback = createDefaultHomePageContent(farmPickup.address)
  const raw = await getSetting(SETTING_KEYS.HOME_PAGE_CONTENT)

  if (!raw) {
    return fallback
  }

  try {
    const parsed = JSON.parse(raw)
    return normalizeHomePageContent(parsed, fallback)
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
