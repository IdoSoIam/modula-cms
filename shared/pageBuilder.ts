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
export type SectionContainerWidth = 'narrow' | 'default' | 'wide' | 'xwide' | 'edge' | 'full'
export type SectionBackgroundMode = 'none' | 'image' | 'carousel'
export type CarouselAnimation = 'slide' | 'fade'
export type CardSize = 'sm' | 'md' | 'lg' | 'xl'
export type TypographySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
export type SectionColumnCount = 1 | 2 | 3 | 4
export type CardsDisplay = 'stack' | 'grid-2' | 'grid-3' | 'grid-4'

export interface ThemeColorSelection {
  token: ThemeColorToken
  customHex?: string
  opacity?: number
}

export interface PageBuilderButton {
  label: LocalizedText
  href: string
  tone: ButtonTone
  size: ButtonSize
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  borderColor?: ThemeColorSelection | null
}

export interface PageBuilderCard {
  id: string
  title: LocalizedText
  text: LocalizedText
  icon?: string
  tone: CardTone
  size: CardSize
  titleSize: TypographySize
  textSize: TypographySize
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  iconColor?: ThemeColorSelection | null
  iconBackgroundColor?: ThemeColorSelection | null
  borderColor?: ThemeColorSelection | null
  backdropBlur?: boolean
  primaryButton?: PageBuilderButton | null
  secondaryButton?: PageBuilderButton | null
}

export interface PageBuilderBadgeItem {
  id: string
  type: 'badge'
  text: LocalizedText
  size: TypographySize
  backgroundColor?: ThemeColorSelection | null
  textColor?: ThemeColorSelection | null
  borderColor?: ThemeColorSelection | null
}

export interface PageBuilderTitleItem {
  id: string
  type: 'title'
  text: LocalizedText
  size: TypographySize
  headingTag: HeadingTag
}

export interface PageBuilderTextItem {
  id: string
  type: 'text'
  text: LocalizedText
  size: TypographySize
}

export interface PageBuilderButtonsItem {
  id: string
  type: 'buttons'
  primaryButton?: PageBuilderButton | null
  secondaryButton?: PageBuilderButton | null
}

export interface PageBuilderCardsItem {
  id: string
  type: 'cards'
  display: CardsDisplay
  cards: PageBuilderCard[]
}

export interface PageBuilderImageItem {
  id: string
  type: 'image'
  imageUrl: string
  alt: LocalizedText
  aspect: ImageAspect
  fit: ImageFit
  verticalAlign: VerticalAlign
  enlarge: boolean
  framed: boolean
}

export interface PageBuilderCarouselItem {
  id: string
  type: 'carousel'
  aspect: ImageAspect
  framed: boolean
  slides: PageBuilderSectionBackgroundCarouselSlide[]
  settings: PageBuilderSectionBackgroundCarouselSettings
}

export interface PageBuilderSectionBackgroundImage {
  imageUrl: string
  alt: LocalizedText
  fit: ImageFit
  verticalAlign: VerticalAlign
  overlayColor?: ThemeColorSelection | null
  overlayOpacity: number
  blur: boolean
}

export interface PageBuilderSectionBackgroundCarouselSlide {
  id: string
  imageUrl: string
  alt: LocalizedText
  fit: ImageFit
  verticalAlign: VerticalAlign
}

export interface PageBuilderSectionBackgroundCarouselSettings {
  autoplay: boolean
  infinite: boolean
  intervalMs: number
  showArrows: boolean
  showDots: boolean
  animation: CarouselAnimation
}

export type PageBuilderColumnItem =
  | PageBuilderBadgeItem
  | PageBuilderTitleItem
  | PageBuilderTextItem
  | PageBuilderButtonsItem
  | PageBuilderCardsItem
  | PageBuilderImageItem
  | PageBuilderCarouselItem

export interface PageBuilderColumn {
  align: ContentAlign
  verticalAlign: VerticalAlign
  textColor?: ThemeColorSelection | null
  items: PageBuilderColumnItem[]
}

export interface PageBuilderSection {
  id: string
  type: 'columns'
  columnCount: SectionColumnCount
  enabled: boolean
  tone: SectionTone
  containerWidth: SectionContainerWidth
  contentVerticalAlign: VerticalAlign
  minHeightPx?: number | null
  backgroundColor?: ThemeColorSelection | null
  backgroundMode: SectionBackgroundMode
  backgroundImage: PageBuilderSectionBackgroundImage
  backgroundCarousel: PageBuilderSectionBackgroundCarouselSlide[]
  backgroundCarouselSettings: PageBuilderSectionBackgroundCarouselSettings
  reverseOnDesktop: boolean
  columns: PageBuilderColumn[]
}

export interface PageBuilderContent {
  version: 1
  sections: PageBuilderSection[]
}

export type PageBuilderContentBlock = PageBuilderColumn
export type PageBuilderImageBlock = PageBuilderImageItem

export const PAGE_BUILDER_SETTING_VERSION = 1 as const

export const BUTTON_TONES: ButtonTone[] = ['primary', 'secondary', 'accent', 'neutral', 'outline']
export const CARD_TONES: CardTone[] = ['base', 'soft', 'outline']
export const IMAGE_ASPECTS: ImageAspect[] = ['landscape', 'square', 'portrait']
export const IMAGE_FITS: ImageFit[] = ['cover', 'contain']
export const CONTENT_ALIGNS: ContentAlign[] = ['start', 'center']
export const VERTICAL_ALIGNS: VerticalAlign[] = ['start', 'center', 'end']
export const SECTION_CONTAINER_WIDTHS: SectionContainerWidth[] = ['narrow', 'default', 'wide', 'xwide', 'edge', 'full']
export const SECTION_BACKGROUND_MODES: SectionBackgroundMode[] = ['none', 'image', 'carousel']
export const SECTION_COLUMN_COUNTS: SectionColumnCount[] = [1, 2, 3, 4]
export const CARD_SIZES: CardSize[] = ['sm', 'md', 'lg', 'xl']
export const TYPOGRAPHY_SIZES: TypographySize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
export const HEADING_TAGS: HeadingTag[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
export const BUTTON_SIZES: ButtonSize[] = ['xs', 'sm', 'md', 'lg']
export const CARDS_DISPLAYS: CardsDisplay[] = ['stack', 'grid-2', 'grid-3', 'grid-4']
export const CAROUSEL_ANIMATIONS: CarouselAnimation[] = ['slide', 'fade']

export const SECTION_CONTAINER_WIDTH_LABELS: Record<SectionContainerWidth, string> = {
  narrow: 'Etroit',
  default: 'Standard',
  wide: 'Large',
  xwide: 'Tres large',
  edge: 'Quasi pleine largeur',
  full: 'Pleine largeur'
}

export const SECTION_COLUMN_COUNT_LABELS: Record<SectionColumnCount, string> = {
  1: '1 colonne',
  2: '2 colonnes',
  3: '3 colonnes',
  4: '4 colonnes'
}

export const SECTION_BACKGROUND_MODE_LABELS: Record<SectionBackgroundMode, string> = {
  none: 'Aucun',
  image: 'Image',
  carousel: 'Carousel'
}

export const CARD_SIZE_LABELS: Record<CardSize, string> = {
  sm: 'Petite',
  md: 'Moyenne',
  lg: 'Grande',
  xl: 'Tres grande'
}

export const TYPOGRAPHY_SIZE_LABELS: Record<TypographySize, string> = {
  xs: 'XS',
  sm: 'S',
  md: 'M',
  lg: 'L',
  xl: 'XL',
  '2xl': '2XL'
}

export const BUTTON_SIZE_LABELS: Record<ButtonSize, string> = {
  xs: 'XS',
  sm: 'S',
  md: 'M',
  lg: 'L'
}

export const CARDS_DISPLAY_LABELS: Record<CardsDisplay, string> = {
  stack: 'Pleine largeur',
  'grid-2': 'Grille 2 colonnes',
  'grid-3': 'Grille 3 colonnes',
  'grid-4': 'Grille 4 colonnes'
}

export const CAROUSEL_ANIMATION_LABELS: Record<CarouselAnimation, string> = {
  slide: 'Slide',
  fade: 'Fade'
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

const ICONIFY_NAME_PATTERN = /^(?:@[a-z0-9]+:)?[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/

export function pickLocalizedText(locale: string, value: LocalizedText | null | undefined) {
  if (!value) return ''
  return locale === 'en' ? value.en : value.fr
}

export function isValidIconifyName(value: string) {
  return ICONIFY_NAME_PATTERN.test(value)
}

export function clonePageBuilderContent(content: PageBuilderContent): PageBuilderContent {
  return JSON.parse(JSON.stringify(content)) as PageBuilderContent
}

export const HEADING_TAG_LABELS: Record<HeadingTag, string> = {
  h1: 'H1',
  h2: 'H2',
  h3: 'H3',
  h4: 'H4',
  h5: 'H5',
  h6: 'H6'
}

function cloneBuilderData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function createBuilderId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyLocalizedText(): LocalizedText {
  return { fr: '', en: '' }
}

export function createEmptyButton(): PageBuilderButton {
  return {
    label: createEmptyLocalizedText(),
    href: '',
    tone: 'primary',
    size: 'md',
    backgroundColor: null,
    textColor: null,
    borderColor: null
  }
}

export function createThemeColorSelection(token: ThemeColorToken = 'primary', customHex = '#3b4d28', opacity = 100): ThemeColorSelection {
  return { token, customHex, opacity }
}

export function createEmptyCard(id: string): PageBuilderCard {
  return {
    id,
    title: createEmptyLocalizedText(),
    text: createEmptyLocalizedText(),
    icon: '',
    tone: 'soft',
    size: 'md',
    titleSize: 'md',
    textSize: 'sm',
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

export function createBadgeItem(id: string): PageBuilderBadgeItem {
  return {
    id,
    type: 'badge',
    text: createEmptyLocalizedText(),
    size: 'sm',
    backgroundColor: null,
    textColor: null,
    borderColor: null
  }
}

export function createTitleItem(id: string): PageBuilderTitleItem {
  return { id, type: 'title', text: createEmptyLocalizedText(), size: 'xl', headingTag: 'h2' }
}

export function createTextItem(id: string): PageBuilderTextItem {
  return { id, type: 'text', text: createEmptyLocalizedText(), size: 'md' }
}

export function createButtonsItem(id: string): PageBuilderButtonsItem {
  return { id, type: 'buttons', primaryButton: createEmptyButton(), secondaryButton: null }
}

export function createCardsItem(id: string): PageBuilderCardsItem {
  return { id, type: 'cards', display: 'stack', cards: [createEmptyCard(`${id}-card-1`)] }
}

export function createImageItem(id: string): PageBuilderImageItem {
  return {
    id,
    type: 'image',
    imageUrl: '',
    alt: createEmptyLocalizedText(),
    aspect: 'landscape',
    fit: 'cover',
    verticalAlign: 'center',
    enlarge: false,
    framed: true
  }
}

export function createCarouselItem(id: string): PageBuilderCarouselItem {
  return {
    id,
    type: 'carousel',
    aspect: 'landscape',
    framed: true,
    slides: [createEmptySectionBackgroundSlide(`${id}-slide-1`)],
    settings: createEmptySectionBackgroundCarouselSettings()
  }
}

export function createEmptySectionBackgroundImage(): PageBuilderSectionBackgroundImage {
  return {
    imageUrl: '',
    alt: createEmptyLocalizedText(),
    fit: 'cover',
    verticalAlign: 'center',
    overlayColor: null,
    overlayOpacity: 35,
    blur: false
  }
}

export function createEmptySectionBackgroundSlide(id: string): PageBuilderSectionBackgroundCarouselSlide {
  return {
    id,
    imageUrl: '',
    alt: createEmptyLocalizedText(),
    fit: 'cover',
    verticalAlign: 'center'
  }
}

export function createEmptySectionBackgroundCarouselSettings(): PageBuilderSectionBackgroundCarouselSettings {
  return {
    autoplay: false,
    infinite: true,
    intervalMs: 5000,
    showArrows: true,
    showDots: true,
    animation: 'slide'
  }
}

export function createEmptyContentBlock(): PageBuilderContentBlock {
  return {
    align: 'start',
    verticalAlign: 'center',
    textColor: null,
    items: []
  }
}

export function createEmptyColumnsSection(id: string, columnCount: SectionColumnCount): PageBuilderSection {
  return {
    id,
    type: 'columns',
    columnCount,
    enabled: true,
    tone: 'base-100',
    containerWidth: 'default',
    contentVerticalAlign: 'center',
    minHeightPx: null,
    backgroundColor: null,
    backgroundMode: 'none',
    backgroundImage: createEmptySectionBackgroundImage(),
    backgroundCarousel: [createEmptySectionBackgroundSlide(`${id}-slide-1`)],
    backgroundCarouselSettings: createEmptySectionBackgroundCarouselSettings(),
    reverseOnDesktop: false,
    columns: Array.from({ length: columnCount }, () => createEmptyContentBlock())
  }
}

export function getAlternatingSectionTone(index: number): SectionTone {
  return index % 2 === 0 ? 'base-100' : 'base-200'
}

function resetButtonColors(button?: PageBuilderButton | null) {
  if (!button) return
  button.backgroundColor = null
  button.textColor = null
  button.borderColor = null
}

function resetCardColors(card: PageBuilderCard) {
  card.backgroundColor = null
  card.textColor = null
  card.iconColor = null
  card.iconBackgroundColor = null
  card.borderColor = null
  resetButtonColors(card.primaryButton)
  resetButtonColors(card.secondaryButton)
}

function resetColumnColors(column: PageBuilderColumn) {
  column.textColor = null
  column.items.forEach((item) => {
    if (item.type === 'badge') {
      item.backgroundColor = null
      item.textColor = null
      item.borderColor = null
    }
    if (item.type === 'buttons') {
      resetButtonColors(item.primaryButton)
      resetButtonColors(item.secondaryButton)
    }
    if (item.type === 'cards') {
      item.cards.forEach(resetCardColors)
    }
  })
}

export function applyDefaultSectionStyling(content: PageBuilderContent) {
  content.sections.forEach((section, index) => {
    section.tone = getAlternatingSectionTone(index)
    section.backgroundColor = null
    section.columns.forEach(resetColumnColors)
  })
  return content
}

export function createDefaultPageBuilderContent(farmAddress: string): PageBuilderContent {
  const intro = createEmptyColumnsSection('intro', 1)
  intro.backgroundMode = 'image'
  intro.backgroundImage.imageUrl = '/images/plaquette.jpg'
  intro.backgroundImage.alt = { fr: 'Production de la ferme', en: 'Farm production' }
  intro.backgroundImage.overlayColor = { token: 'neutral', opacity: 100 }
  intro.backgroundImage.overlayOpacity = 55
  intro.columns[0]?.items.push(
    createBadgeItem('intro-badge'),
    createTitleItem('intro-title'),
    createTextItem('intro-text'),
    createButtonsItem('intro-buttons')
  )
  const introItems = intro.columns[0]?.items || []
  const introBadge = introItems[0] as PageBuilderBadgeItem
  const introTitle = introItems[1] as PageBuilderTitleItem
  const introText = introItems[2] as PageBuilderTextItem
  const introButtons = introItems[3] as PageBuilderButtonsItem
  introBadge.text = { fr: 'Nom du site', en: 'Site name' }
  intro.columns[0]!.textColor = { token: 'white', opacity: 100 }
  introTitle.text = { fr: 'Production locale, bio et de saison', en: 'Local, organic and seasonal production' }
  introText.text = {
    fr: 'Micro-ferme agroecologique en agriculture biologique. Legumes, vente directe et reservation de paniers au plus proche de la ferme.',
    en: 'Micro ecological organic farm. Vegetables, direct sales and basket reservations close to the farm.'
  }
  introButtons.primaryButton = {
    label: { fr: 'Voir les paniers', en: 'View baskets' },
    href: '/paniers',
    tone: 'primary',
    size: 'lg'
  }
  introButtons.secondaryButton = {
    label: { fr: 'Nous rencontrer', en: 'Meet us' },
    href: '/contact',
    tone: 'outline',
    size: 'lg'
  }

  const activities = createEmptyColumnsSection('activities', 2)
  const col1 = activities.columns[0]
  const col2 = activities.columns[1]
  col1?.items.push(createBadgeItem('activities-badge'), createTitleItem('activities-title'), createTextItem('activities-text'), createCardsItem('activities-cards'), createButtonsItem('activities-buttons'))
  col2?.items.push(createImageItem('activities-image'))

  const aBadge = col1?.items[0] as PageBuilderBadgeItem
  const aTitle = col1?.items[1] as PageBuilderTitleItem
  const aText = col1?.items[2] as PageBuilderTextItem
  const aCards = col1?.items[3] as PageBuilderCardsItem
  const aButtons = col1?.items[4] as PageBuilderButtonsItem
  const aImage = col2?.items[0] as PageBuilderImageItem

  aBadge.text = { fr: 'Nos Activites', en: 'Our Activities' }
  aTitle.text = { fr: 'Une ferme a taille humaine', en: 'A human-scale farm' }
  aText.text = {
    fr: 'Une ferme a taille humaine qui combine production maraichere, paniers, vente directe et autres ateliers agricoles de maniere progressive et coherente.',
    en: 'A human-scale farm combining vegetable production, baskets, direct sales and other agricultural activities in a coherent way.'
  }
  aCards.display = 'grid-2'
  aCards.cards = [
    { ...createEmptyCard('activities-1'), title: { fr: 'Maraichage Bio', en: 'Organic Market Gardening' }, text: { fr: 'Production de legumes frais et de saison en agriculture biologique.', en: 'Fresh seasonal vegetables grown organically.' }, icon: 'mdi:sprout' },
    { ...createEmptyCard('activities-2'), title: { fr: 'Paniers de legumes', en: 'Vegetable baskets' }, text: { fr: 'Reservez votre panier hebdomadaire de legumes frais, bio et de saison, recoltes a la ferme.', en: 'Reserve your weekly basket of fresh, organic seasonal vegetables harvested at the farm.' }, icon: 'mdi:basket-outline' },
    { ...createEmptyCard('activities-3'), title: { fr: 'Oeufs & Volailles', en: 'Eggs & Poultry' }, text: { fr: 'Elevage de poules en plein air et production d oeufs bio.', en: 'Free-range poultry and organic egg production.' }, icon: 'mdi:egg-outline' },
    { ...createEmptyCard('activities-4'), title: { fr: 'Diversification de la ferme', en: 'Farm diversification' }, text: { fr: 'La ferme developpe aussi d autres ateliers et cultures pour construire un modele agricole resilient.', en: 'The farm is also developing other activities and crops to build a resilient model.' }, icon: 'mdi:leaf-circle-outline' }
  ]
  aButtons.primaryButton = { label: { fr: 'Voir les paniers', en: 'View baskets' }, href: '/paniers', tone: 'primary', size: 'md' }
  aImage.imageUrl = '/images/erasebg-transformed.png'
  aImage.alt = { fr: 'Logo du site', en: 'Site logo' }
  aImage.aspect = 'square'
  aImage.fit = 'contain'

  const directSale = createEmptyColumnsSection('direct-sale', 2)
  directSale.tone = 'base-200'
  directSale.reverseOnDesktop = true
  const dImageColumn = directSale.columns[0]
  const dTextColumn = directSale.columns[1]
  dImageColumn?.items.push(createImageItem('sale-image'))
  dTextColumn?.items.push(createBadgeItem('sale-badge'), createTitleItem('sale-title'), createTextItem('sale-text'), createCardsItem('sale-cards'), createButtonsItem('sale-buttons'))
  const dImage = dImageColumn?.items[0] as PageBuilderImageItem
  const dBadge = dTextColumn?.items[0] as PageBuilderBadgeItem
  const dTitle = dTextColumn?.items[1] as PageBuilderTitleItem
  const dText = dTextColumn?.items[2] as PageBuilderTextItem
  const dCards = dTextColumn?.items[3] as PageBuilderCardsItem
  const dButtons = dTextColumn?.items[4] as PageBuilderButtonsItem
  dImage.imageUrl = '/images/plaquette.jpg'
  dImage.alt = { fr: 'Legumes et productions de la ferme', en: 'Vegetables and farm produce' }
  dBadge.text = { fr: 'Le rendez-vous de la semaine', en: 'This week appointment' }
  dTitle.text = { fr: 'Vente Directe', en: 'Direct sales' }
  dText.text = {
    fr: 'Deux rendez-vous simples et reguliers pour retrouver les produits de la ferme, poser vos questions et choisir le format qui vous convient.',
    en: 'Two regular appointments to discover the farm products, ask questions and choose the format that suits you.'
  }
  dCards.display = 'stack'
  dCards.cards = [
    { ...createEmptyCard('sale-1'), title: { fr: 'Vente directe a la ferme', en: 'Farm direct sale' }, text: { fr: 'Tous les lundi de 16h00 a 19h00\n' + farmAddress, en: 'Every Monday from 4pm to 7pm\n' + farmAddress }, icon: 'mdi:home-heart' },
    { ...createEmptyCard('sale-2'), title: { fr: 'Marche de Saint-Sebastien', en: 'Saint-Sebastien market' }, text: { fr: 'Tous les samedi de 9h30 a 12h00\nSur la terrasse du Saint Seb', en: 'Every Saturday from 9:30am to 12pm\nOn the Saint Seb terrace' }, icon: 'mdi:storefront-outline' }
  ]
  dButtons.primaryButton = { label: { fr: 'Nous trouver', en: 'Find us' }, href: '/contact', tone: 'primary', size: 'md' }

  return {
    version: PAGE_BUILDER_SETTING_VERSION,
    sections: [intro, activities, directSale]
  }
}

export function duplicatePageBuilderCard(card: PageBuilderCard): PageBuilderCard {
  const clone = cloneBuilderData(card)
  clone.id = createBuilderId('card')
  return clone
}

export function duplicatePageBuilderItem(item: PageBuilderColumnItem): PageBuilderColumnItem {
  const clone = cloneBuilderData(item)
  clone.id = createBuilderId(item.type)

  if (clone.type === 'cards') {
    clone.cards = clone.cards.map(card => duplicatePageBuilderCard(card))
  }

  if (clone.type === 'carousel') {
    clone.slides = clone.slides.map(slide => ({
      ...slide,
      id: createBuilderId('slide')
    }))
  }

  return clone
}

export function duplicatePageBuilderSection(section: PageBuilderSection): PageBuilderSection {
  const clone = cloneBuilderData(section)
  clone.id = createBuilderId('section')
  clone.backgroundCarousel = clone.backgroundCarousel.map(slide => ({
    ...slide,
    id: createBuilderId('slide')
  }))
  clone.columns = clone.columns.map((column) => ({
    ...column,
    items: column.items.map(item => duplicatePageBuilderItem(item))
  }))
  return clone
}
