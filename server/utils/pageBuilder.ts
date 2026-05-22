import type {
  CardsDisplay,
  PageBuilderButton,
  PageBuilderCard,
  PageBuilderColumn,
  PageBuilderColumnItem,
  PageBuilderContent,
  PageBuilderSectionItem,
  PageBuilderSection,
  ThemeColorSelection,
  ThemeColorToken
} from '~/shared/pageBuilder'
import {
  createBadgeItem,
  createButtonsItem,
  createCardsItem,
  createCarouselItem,
  createDefaultPageBuilderContent,
  createEmptyCard,
  createEmptyCardElement,
  createEmptyColumnsSection,
  createEmptyFormAction,
  createEmptyFormField,
  createEmptyFormFieldOption,
  createEmptyFormRow,
  createEmptyFormSection,
  createEmptyContentBlock,
  createEmptySectionBackgroundCarouselSettings,
  createEmptySectionBackgroundImage,
  createEmptySectionBackgroundSlide,
  createFormItem,
  createImageItem,
  createTextItem,
  createTitleItem,
  isValidIconifyName,
  THEME_COLOR_TOKENS
} from '~/shared/pageBuilder'
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

function sanitizeRequestedImageWidth(value: unknown) {
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

function normalizeButton(value: unknown): PageBuilderButton | null {
  if (!isObject(value)) return null
  const label = normalizeLocalizedText(value.label)
  if (!label || typeof value.href !== 'string') return null
  return {
    label,
    href: value.href,
    tone: (typeof value.tone === 'string' ? value.tone : 'primary') as PageBuilderButton['tone'],
    size: (typeof value.size === 'string' ? value.size : 'md') as PageBuilderButton['size'],
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

function normalizeCardElements(value: unknown, fallbackId: string, legacy?: { title: { fr: string, en: string }, text: { fr: string, en: string }, icon: string, titleSize: PageBuilderCard['titleSize'], textSize: PageBuilderCard['textSize'] }) {
  if (Array.isArray(value)) {
    return value.map((entry, index) => {
      const element = createEmptyCardElement(`${fallbackId}-element-${index + 1}`)
      if (!isObject(entry)) return element
      element.id = typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : element.id
      element.kind = entry.kind === 'title' ? 'title' : 'text'
      element.source = entry.source === 'opening-hours' || entry.source === 'email' || entry.source === 'phone' || entry.source === 'address' || entry.source === 'social-links'
        ? entry.source
        : 'custom'
      element.icon = sanitizeIconName(entry.icon)
      element.title = normalizeLocalizedText(entry.title) || element.title
      element.text = normalizeLocalizedText(entry.text) || element.text
      element.titleSize = (typeof entry.titleSize === 'string' ? entry.titleSize : element.titleSize) as typeof element.titleSize
      element.textSize = (typeof entry.textSize === 'string' ? entry.textSize : element.textSize) as typeof element.textSize
      return element
    })
  }

  if (!legacy) return []

  const elements = []
  if (legacy.title.fr || legacy.title.en) {
    const titleElement = createEmptyCardElement(`${fallbackId}-element-1`, 'title')
    titleElement.icon = legacy.icon
    titleElement.title = legacy.title
    titleElement.titleSize = legacy.titleSize
    elements.push(titleElement)
  }
  if (legacy.text.fr || legacy.text.en) {
    const textElement = createEmptyCardElement(`${fallbackId}-element-${elements.length + 1}`, 'text')
    textElement.text = legacy.text
    textElement.textSize = legacy.textSize
    elements.push(textElement)
  }
  return elements
}

function normalizeCard(value: unknown): PageBuilderCard | null {
  if (!isObject(value)) return null
  const title = normalizeLocalizedText(value.title)
  const text = normalizeLocalizedText(value.text)
  if (!title || !text) return null
  const id = typeof value.id === 'string' ? value.id : `card-${Math.random().toString(36).slice(2, 8)}`
  const icon = sanitizeIconName(value.icon)
  return {
    id,
    title,
    text,
    icon,
    elements: normalizeCardElements(value.elements, id, {
      title,
      text,
      icon,
      titleSize: (typeof value.titleSize === 'string' ? value.titleSize : 'md') as PageBuilderCard['titleSize'],
      textSize: (typeof value.textSize === 'string' ? value.textSize : 'sm') as PageBuilderCard['textSize']
    }),
    tone: (typeof value.tone === 'string' ? value.tone : 'soft') as PageBuilderCard['tone'],
    size: (typeof value.size === 'string' ? value.size : 'md') as PageBuilderCard['size'],
    titleSize: (typeof value.titleSize === 'string' ? value.titleSize : 'md') as PageBuilderCard['titleSize'],
    textSize: (typeof value.textSize === 'string' ? value.textSize : 'sm') as PageBuilderCard['textSize'],
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

function normalizeFormFieldOption(value: unknown, fallbackId: string) {
  const option = createEmptyFormFieldOption(fallbackId)
  if (!isObject(value)) return option
  option.id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallbackId
  option.label = normalizeLocalizedText(value.label) || option.label
  option.value = typeof value.value === 'string' ? value.value : ''
  return option
}

function normalizeFormField(value: unknown, fallbackId: string) {
  const field = createEmptyFormField(fallbackId)
  if (!isObject(value)) return field
  field.id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallbackId
  field.name = typeof value.name === 'string' && value.name.trim()
    ? value.name.trim().replace(/[^a-zA-Z0-9_]/g, '_')
    : field.name
  field.type = typeof value.type === 'string' ? value.type as typeof field.type : field.type
  field.width = value.width === 1 ? 1 : 2
  field.label = normalizeLocalizedText(value.label) || field.label
  field.placeholder = normalizeLocalizedText(value.placeholder) || field.placeholder
  field.helpText = normalizeLocalizedText(value.helpText) || field.helpText
  field.required = typeof value.required === 'boolean' ? value.required : field.required
  field.defaultValue = typeof value.defaultValue === 'string' ? value.defaultValue : field.defaultValue
  field.defaultChecked = typeof value.defaultChecked === 'boolean' ? value.defaultChecked : field.defaultChecked
  field.regexPattern = typeof value.regexPattern === 'string' ? value.regexPattern : ''
  field.errorMessage = normalizeLocalizedText(value.errorMessage) || field.errorMessage
  field.textareaMinLines = typeof value.textareaMinLines === 'number' && Number.isFinite(value.textareaMinLines)
    ? Math.max(2, Math.min(20, Math.round(value.textareaMinLines)))
    : field.textareaMinLines
  field.options = Array.isArray(value.options)
    ? value.options.map((option, index) => normalizeFormFieldOption(option, `${field.id}-option-${index + 1}`))
    : field.options
  if (field.type !== 'select' && field.type !== 'radio') {
    field.options = []
  } else if (!field.options.length) {
    field.options = [createEmptyFormFieldOption(`${field.id}-option-1`)]
  }
  return field
}

function normalizeFormRow(value: unknown, fallbackId: string) {
  const row = createEmptyFormRow(fallbackId)
  if (!isObject(value)) return row
  row.id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallbackId
  row.fields = Array.isArray(value.fields)
    ? value.fields.slice(0, 2).map((field, index) => normalizeFormField(field, `${row.id}-field-${index + 1}`))
    : row.fields
  if (!row.fields.length) {
    row.fields = [createEmptyFormField(`${row.id}-field-1`)]
  }
  return row
}

function normalizeFormSection(value: unknown, fallbackId: string) {
  const section = createEmptyFormSection(fallbackId)
  if (!isObject(value)) return section
  section.id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallbackId
  section.title = normalizeLocalizedText(value.title) || section.title
  section.description = normalizeLocalizedText(value.description) || section.description
  section.rows = Array.isArray(value.rows)
    ? value.rows.map((row, index) => normalizeFormRow(row, `${section.id}-row-${index + 1}`))
    : section.rows
  if (!section.rows.length) {
    section.rows = [createEmptyFormRow(`${section.id}-row-1`)]
  }
  return section
}

function normalizeFormRowsFromLegacySections(value: unknown, fallbackItemId: string) {
  if (!Array.isArray(value)) {
    return [createEmptyFormRow(`${fallbackItemId}-row-1`)]
  }

  const rows = value
    .flatMap((section, sectionIndex) => normalizeFormSection(section, `${fallbackItemId}-section-${sectionIndex + 1}`).rows)
    .map((row, rowIndex) => ({
      ...row,
      id: row.id || `${fallbackItemId}-row-${rowIndex + 1}`
    }))

  return rows.length ? rows : [createEmptyFormRow(`${fallbackItemId}-row-1`)]
}

function normalizeColumnItem(value: unknown): PageBuilderColumnItem | null {
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
      item.align = (typeof value.align === 'string' ? value.align : 'start') as typeof item.align
      item.textColor = normalizeThemeColorSelection(value.textColor, 'base-content')
      return item
    }
    case 'text': {
      const text = normalizeLocalizedText(value.text)
      if (!text) return null
      const item = createTextItem(typeof value.id === 'string' ? value.id : `text-${Math.random().toString(36).slice(2, 8)}`)
      item.text = text
      item.size = (typeof value.size === 'string' ? value.size : 'md') as typeof item.size
      item.align = (typeof value.align === 'string' ? value.align : 'start') as typeof item.align
      item.textColor = normalizeThemeColorSelection(value.textColor, 'base-content')
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
      item.cards = Array.isArray(value.cards) ? value.cards.map(normalizeCard).filter((card): card is PageBuilderCard => Boolean(card)) : []
      return item
    }
    case 'image': {
      const item = createImageItem(typeof value.id === 'string' ? value.id : `image-${Math.random().toString(36).slice(2, 8)}`)
      item.imageUrl = typeof value.imageUrl === 'string' ? value.imageUrl : ''
      item.alt = normalizeLocalizedText(value.alt) || item.alt
      item.requestedWidthPx = sanitizeRequestedImageWidth(value.requestedWidthPx)
      item.aspect = (typeof value.aspect === 'string' ? value.aspect : 'landscape') as typeof item.aspect
      item.fit = (typeof value.fit === 'string' ? value.fit : 'cover') as typeof item.fit
      item.verticalAlign = (typeof value.verticalAlign === 'string' ? value.verticalAlign : 'center') as typeof item.verticalAlign
      item.enlarge = typeof value.enlarge === 'boolean' ? value.enlarge : false
      item.framed = typeof value.framed === 'boolean' ? value.framed : true
      item.lightboxEnabled = typeof value.lightboxEnabled === 'boolean' ? value.lightboxEnabled : false
      return item
    }
    case 'carousel': {
      const item = createCarouselItem(typeof value.id === 'string' ? value.id : `carousel-${Math.random().toString(36).slice(2, 8)}`)
      item.requestedWidthPx = sanitizeRequestedImageWidth(value.requestedWidthPx)
      item.aspect = (typeof value.aspect === 'string' ? value.aspect : 'landscape') as typeof item.aspect
      item.framed = typeof value.framed === 'boolean' ? value.framed : true
      item.lightboxEnabled = typeof value.lightboxEnabled === 'boolean' ? value.lightboxEnabled : false
      item.slides = normalizeSectionBackgroundSlides(value.slides, item.id)
      item.settings = normalizeCarouselSettings(value.settings)
      return item
    }
    case 'form': {
      const item = createFormItem(typeof value.id === 'string' ? value.id : `form-${Math.random().toString(36).slice(2, 8)}`)
      item.formKey = typeof value.formKey === 'string' && value.formKey.trim() ? value.formKey.trim() : item.formKey
      item.title = normalizeLocalizedText(value.title) || item.title
      item.intro = normalizeLocalizedText(value.intro) || item.intro
      item.submitLabel = normalizeLocalizedText(value.submitLabel) || item.submitLabel
      item.successMessage = normalizeLocalizedText(value.successMessage) || item.successMessage
      item.submitButtonTone = (typeof value.submitButtonTone === 'string' ? value.submitButtonTone : item.submitButtonTone) as typeof item.submitButtonTone
      item.cardBackgroundColor = normalizeThemeColorSelection(value.cardBackgroundColor, 'base-100')
      item.labelColor = normalizeThemeColorSelection(value.labelColor, 'base-content')
      item.submitButtonBackgroundColor = normalizeThemeColorSelection(value.submitButtonBackgroundColor, 'primary')
      item.submitButtonTextColor = normalizeThemeColorSelection(value.submitButtonTextColor, 'primary-content')
      item.submitButtonBorderColor = normalizeThemeColorSelection(value.submitButtonBorderColor, 'transparent')
      item.rows = Array.isArray(value.rows)
        ? value.rows.map((row, index) => normalizeFormRow(row, `${item.id}-row-${index + 1}`))
        : normalizeFormRowsFromLegacySections(value.sections, item.id)
      if (!item.rows.length) {
        item.rows = [createEmptyFormRow(`${item.id}-row-1`)]
      }
      if (isObject(value.action)) {
        if (value.action.type === 'internalWebhook') {
          item.action = {
            type: 'internalWebhook',
            actionKey: typeof value.action.actionKey === 'string' ? value.action.actionKey.trim() : ''
          }
        } else {
          const action = createEmptyFormAction()
          action.toMode = value.action.toMode === 'field' || value.action.toMode === 'current-user' ? value.action.toMode : 'custom'
          action.to = typeof value.action.to === 'string' ? value.action.to.trim() : ''
          action.toFieldName = typeof value.action.toFieldName === 'string' ? value.action.toFieldName.trim() : ''
          action.templateAction = typeof value.action.templateAction === 'string' ? value.action.templateAction.trim() : ''
          action.replyToFieldName = typeof value.action.replyToFieldName === 'string' ? value.action.replyToFieldName.trim() : ''
          action.cc = typeof value.action.cc === 'string' ? value.action.cc.trim() : ''
          action.bcc = typeof value.action.bcc === 'string' ? value.action.bcc.trim() : ''
          item.action = action
        }
      }
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
  background.requestedWidthPx = sanitizeRequestedImageWidth(value.requestedWidthPx)
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
  const items: PageBuilderColumnItem[] = []
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
    item.textColor = normalizeThemeColorSelection(value.textColor, 'base-content')
    items.push(item)
  }
  const text = normalizeLocalizedText(value.text)
  if (text && (text.fr || text.en)) {
    const item = createTextItem(`text-${Math.random().toString(36).slice(2, 8)}`)
    item.text = text
    item.size = (typeof value.textSize === 'string' ? value.textSize : 'md') as typeof item.size
    item.textColor = normalizeThemeColorSelection(value.textColor, 'base-content')
    items.push(item)
  }
  const cards = Array.isArray(value.cards) ? value.cards.map(normalizeCard).filter((card): card is PageBuilderCard => Boolean(card)) : []
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

function normalizeColumn(value: unknown): PageBuilderColumn | null {
  if (!isObject(value)) return null

  if (typeof value.type === 'string' && value.type === 'image') {
    const column = createEmptyContentBlock()
    column.items = [normalizeColumnItem({ ...value, type: 'image' })!].filter(Boolean)
    return column
  }

  const column = createEmptyContentBlock()
  column.align = (typeof value.align === 'string' ? value.align : 'start') as PageBuilderColumn['align']
  column.verticalAlign = (typeof value.verticalAlign === 'string' ? value.verticalAlign : 'center') as PageBuilderColumn['verticalAlign']
  column.textColor = normalizeThemeColorSelection(value.textColor, 'base-content')
  column.items = Array.isArray(value.items)
    ? value.items.map(normalizeColumnItem).filter((item): item is PageBuilderColumnItem => Boolean(item))
    : migrateLegacyItems(value)
  return column
}

function normalizeSectionItems(value: unknown): PageBuilderSectionItem[] {
  if (!Array.isArray(value)) return []
  return value
    .map(normalizeColumnItem)
    .filter((item): item is PageBuilderSectionItem => item !== null && (item.type === 'title' || item.type === 'text'))
}

function heroToSection(hero: Record<string, unknown>): PageBuilderSection | null {
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
    item.textColor = { token: 'white', opacity: 100 }
    column.items.push(item)
  }

  const text = normalizeLocalizedText(hero.text)
  if (text && (text.fr || text.en)) {
    const item = createTextItem('hero-text')
    item.text = text
    item.size = (typeof hero.textSize === 'string' ? hero.textSize : 'lg') as typeof item.size
    item.textColor = { token: 'white', opacity: 100 }
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

  const highlights = Array.isArray(hero.highlights) ? hero.highlights.map(normalizeCard).filter((card): card is PageBuilderCard => Boolean(card)) : []
  if (highlights.length) {
    const item = createCardsItem('hero-cards')
    item.display = 'grid-2'
    item.cards = highlights
    column.items.push(item)
  }

  return section
}

function normalizeSection(value: unknown): PageBuilderSection | null {
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
  section.tone = (typeof value.tone === 'string' ? value.tone : 'base-100') as PageBuilderSection['tone']
  section.containerWidth = (typeof value.containerWidth === 'string' ? value.containerWidth : 'default') as PageBuilderSection['containerWidth']
  section.contentVerticalAlign = (typeof value.contentVerticalAlign === 'string' ? value.contentVerticalAlign : 'center') as PageBuilderSection['contentVerticalAlign']
  section.minHeightPx = sanitizeSectionMinHeight(value.minHeightPx)
  section.backgroundColor = normalizeThemeColorSelection(value.backgroundColor, 'base-100')
  section.backgroundMode = (typeof value.backgroundMode === 'string' ? value.backgroundMode : 'none') as PageBuilderSection['backgroundMode']
  section.backgroundImage = normalizeSectionBackgroundImage(value.backgroundImage)
  section.backgroundCarousel = normalizeSectionBackgroundSlides(value.backgroundCarousel, section.id)
  section.backgroundCarouselSettings = normalizeCarouselSettings(value.backgroundCarouselSettings)
  section.reverseOnDesktop = typeof value.reverseOnDesktop === 'boolean' ? value.reverseOnDesktop : false
  section.beforeItems = normalizeSectionItems(value.beforeItems)
  section.afterItems = normalizeSectionItems(value.afterItems)

  const rawColumns = Array.isArray(value.columns)
    ? value.columns
    : isObject((value as any).column)
      ? [(value as any).column]
      : []

  const normalized = rawColumns.map(normalizeColumn).filter((column): column is PageBuilderColumn => Boolean(column))
  if (normalized.length) {
    section.columns = normalized.slice(0, section.columnCount)
    while (section.columns.length < section.columnCount) {
      section.columns.push(createEmptyContentBlock())
    }
  }

  return section
}

export function normalizePageBuilderContent(value: unknown, fallback: PageBuilderContent): PageBuilderContent {
  if (!isObject(value) || value.version !== 1) {
    return fallback
  }

  const sections = Array.isArray(value.sections)
    ? value.sections.map(normalizeSection).filter((section): section is PageBuilderSection => Boolean(section))
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

export async function getPageBuilderContent(): Promise<PageBuilderContent> {
  const farmPickup = await getFarmPickupConfig()
  const fallback = createDefaultPageBuilderContent(farmPickup.address)
  const raw = await getSetting(SETTING_KEYS.PAGE_BUILDER_CONTENT)
  if (!raw) return fallback
  try {
    return normalizePageBuilderContent(JSON.parse(raw), fallback)
  } catch {
    return fallback
  }
}

export async function savePageBuilderContent(content: PageBuilderContent) {
  const farmPickup = await getFarmPickupConfig()
  const fallback = createDefaultPageBuilderContent(farmPickup.address)
  const normalized = normalizePageBuilderContent(content, fallback)
  await setSetting(SETTING_KEYS.PAGE_BUILDER_CONTENT, JSON.stringify(normalized))

  const { syncImageUsageTable } = await import('./imageReferences')
  await syncImageUsageTable()
}
