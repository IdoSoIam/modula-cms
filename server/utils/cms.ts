import { prisma } from '~/prisma/client'
import type { CmsNavigationItem, CmsPage } from '@prisma/client'
import type {
  CmsHeaderNavigationStyle,
  CmsHeaderMobileLogoPosition,
  CmsHeaderSubmenuAnimation,
  CmsHeaderSubmenuTrigger,
  CmsApplicationPosition,
  CmsCookieBannerSettings,
  CmsCookieService,
  CmsCookieServiceCategory,
  CmsCookieServiceStorage,
  CmsFooterBlock,
  CmsLocale,
  CmsNavigationItemPayload,
  CmsNavigationMenu,
  CmsNavigationItemType,
  CmsPagePayload,
  CmsPageSpecialRole,
  CmsPageSeo,
  CmsPageStatus,
  CmsPageTranslation,
  CmsPageType,
  CmsSiteSettings,
  PublicSiteShell,
  ResolvedCmsNavigationItem,
  ResolvedCmsPage
} from '~/shared/cms'
import type { FeatureFlags } from '~/server/utils/settings'
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
import type { CmsEventsPageSettings, CmsPlanningPageSettings } from '~/shared/events'
import type { PageBuilderContent, ThemeColorSelection } from '~/shared/pageBuilder'
import {
  clonePageBuilderContent,
  createBadgeItem,
  createButtonsItem,
  createCardsItem,
  createEmptyColumnsSection,
  createFormItem,
  createTextItem,
  createThemeColorSelection,
  createTitleItem,
  type PageBuilderCardsItem,
  type PageBuilderFormItem,
  type PageBuilderTextItem,
  type PageBuilderTitleItem
} from '~/shared/pageBuilder'
import { CMS_THEME_COLOR_TOKENS } from '~/shared/cms'
import { getPageBuilderContent, normalizePageBuilderContent } from '~/server/utils/pageBuilder'
import { getSetting, setSetting, SETTING_KEYS } from '~/server/utils/settings'
import { createCustomAdminEmailTemplate, findAdminEmailTemplateDefinition, syncCustomAdminEmailTemplateDefinition } from '~/server/utils/adminEmailTemplates'

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

function normalizeLocalizedTextWithFallback(value: unknown, fallback: { fr: string, en: string }) {
  const normalized = normalizeLocalizedText(value)
  return {
    fr: normalized.fr || fallback.fr,
    en: normalized.en || fallback.en
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

function createNavigationItemKey(index: number) {
  return `nav-item-${index + 1}`
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

function normalizeNavigationItemKey(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizeParentNavigationItemKey(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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
    content: normalizePageBuilderContent(value.content, fallback.content)
  }
}

function isEmptyPageBuilderContent(content: PageBuilderContent | null | undefined) {
  return !content || !Array.isArray(content.sections) || content.sections.length === 0
}

function pickSharedPageContent(translations: Record<CmsLocale, CmsPageTranslation>) {
  if (!isEmptyPageBuilderContent(translations.fr.content)) {
    return clonePageBuilderContent(translations.fr.content)
  }

  if (!isEmptyPageBuilderContent(translations.en.content)) {
    return clonePageBuilderContent(translations.en.content)
  }

  return createEmptyPageBuilderContent()
}

function synchronizeSharedPageContent(translations: Record<CmsLocale, CmsPageTranslation>) {
  const sharedContent = pickSharedPageContent(translations)

  return {
    fr: {
      ...translations.fr,
      content: clonePageBuilderContent(sharedContent)
    },
    en: {
      ...translations.en,
      content: clonePageBuilderContent(sharedContent)
    }
  }
}

async function ensureFormEmailTemplateActions(payload: CmsPagePayload) {
  const getFormTemplateVariables = (item: PageBuilderFormItem) => {
    const fieldNames = item.rows
      .flatMap(row => row.fields.map(field => field.name.trim()))
      .filter(Boolean)

    const aliases = new Set<string>(['formTitle', 'pageTitle', 'pagePath', 'submittedAt', 'fieldsSummary', 'replyToEmail'])
    for (const fieldName of fieldNames) {
      if (/name|nom/i.test(fieldName)) aliases.add('contactName')
      if (/mail|email|courriel/i.test(fieldName)) aliases.add('contactEmail')
      if (/message|msg|demande|contenu/i.test(fieldName)) aliases.add('contactMessage')
      if (/phone|telephone|tel|mobile/i.test(fieldName)) aliases.add('contactPhone')
    }

    return Array.from(new Set([
      ...aliases,
      ...fieldNames,
      ...fieldNames.map(name => `field_${name}`)
    ])).sort()
  }

  const sharedContent = pickSharedPageContent(payload.translations)
  for (const section of sharedContent.sections) {
    for (const column of section.columns) {
      for (const item of column.items) {
        if (item.type !== 'form' || item.action.type !== 'email') continue
        const variables = getFormTemplateVariables(item)
        if (item.action.templateAction) {
          const existing = await findAdminEmailTemplateDefinition(item.action.templateAction)
          if (existing) {
            await syncCustomAdminEmailTemplateDefinition({
              action: existing.action,
              label: `Formulaire ${payload.slug} ${item.formKey || item.id}`,
              description: `Template email généré pour le formulaire ${item.formKey || item.id} de la page ${payload.path}`,
              group: 'Formulaires',
              subgroup: 'CMS',
              variables
            })
            continue
          }
        }

        const created = await createCustomAdminEmailTemplate({
          label: `Formulaire ${payload.slug} ${item.formKey || item.id}`,
          description: `Template email généré pour le formulaire ${item.formKey || item.id} de la page ${payload.path}`,
          group: 'Formulaires',
          subgroup: 'CMS',
          variables
        })
        item.action.templateAction = created.action
      }
    }
  }
  payload.translations = synchronizeSharedPageContent({
    fr: {
      ...payload.translations.fr,
      content: clonePageBuilderContent(sharedContent)
    },
    en: {
      ...payload.translations.en,
      content: clonePageBuilderContent(sharedContent)
    }
  })
}

function normalizeTranslations(value: unknown, path = '/'): Record<CmsLocale, CmsPageTranslation> {
  const fallback = createDefaultCmsPagePayload(path).translations
  if (!isObject(value)) return fallback

  return synchronizeSharedPageContent({
    fr: normalizeTranslation(value.fr),
    en: normalizeTranslation(value.en)
  })
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

function isCmsPageSpecialRole(value: unknown): value is CmsPageSpecialRole {
  return typeof value === 'string' && CMS_PAGE_SPECIAL_ROLES.has(value as CmsPageSpecialRole)
}

function isCmsCookieServiceCategory(value: unknown): value is CmsCookieServiceCategory {
  return typeof value === 'string' && CMS_COOKIE_SERVICE_CATEGORIES.has(value as CmsCookieServiceCategory)
}

function isCmsCookieServiceStorage(value: unknown): value is CmsCookieServiceStorage {
  return typeof value === 'string' && CMS_COOKIE_SERVICE_STORAGES.has(value as CmsCookieServiceStorage)
}

function createSimpleContentPage(options: {
  sectionId: string
  badge?: { fr: string, en: string }
  title: { fr: string, en: string }
  paragraphs: Array<{ fr: string, en: string }>
}) {
  const section = createEmptyColumnsSection(options.sectionId, 1)
  if (options.badge) {
    const badge = createBadgeItem(`${options.sectionId}-badge`)
    badge.text = options.badge
    section.columns[0]?.items.push(badge)
  }
  const title = createTitleItem(`${options.sectionId}-title`)
  title.headingTag = 'h1'
  title.size = '2xl'
  title.text = options.title
  section.columns[0]?.items.push(title)

  for (const [index, paragraph] of options.paragraphs.entries()) {
    const text = createTextItem(`${options.sectionId}-text-${index + 1}`)
    text.size = 'md'
    text.text = paragraph
    section.columns[0]?.items.push(text)
  }

  return {
    version: 1 as const,
    sections: [section]
  }
}

function createDefaultConstructionPageContent() {
  return createSimpleContentPage({
    sectionId: 'construction',
    badge: { fr: 'Mise à jour', en: 'Update' },
    title: { fr: 'Site en cours de construction', en: 'Site under construction' },
    paragraphs: [
      {
        fr: 'La ferme prépare actuellement son site public. Revenez très bientôt pour découvrir les paniers, les actualités et les informations pratiques.',
        en: 'The farm is currently preparing its public site. Please check back soon for baskets, news and practical information.'
      }
    ]
  })
}

function createDefaultLegalPageContent(options: {
  sectionId: string
  title: { fr: string, en: string }
  intro: { fr: string, en: string }
  blocks: Array<{ title: { fr: string, en: string }, text: { fr: string, en: string } }>
}) {
  const section = createEmptyColumnsSection(options.sectionId, 1)
  const title = createTitleItem(`${options.sectionId}-title`)
  title.headingTag = 'h1'
  title.size = '2xl'
  title.text = options.title
  const intro = createTextItem(`${options.sectionId}-intro`)
  intro.text = options.intro
  section.columns[0]?.items.push(title, intro)

  const cards = createCardsItem(`${options.sectionId}-cards`) as PageBuilderCardsItem
  cards.display = 'stack'
  cards.cards = options.blocks.map((block, index) => ({
    id: `${options.sectionId}-card-${index + 1}`,
    title: block.title,
    text: block.text,
    icon: 'mdi:file-document-outline',
    elements: [],
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
  }))
  section.columns[0]?.items.push(cards)

  return {
    version: 1 as const,
    sections: [section]
  }
}

function createDefaultContactPageContent() {
  const introSection = createEmptyColumnsSection('contact-intro', 2)
  const leftTitle = createTitleItem('contact-title') as PageBuilderTitleItem
  leftTitle.headingTag = 'h1'
  leftTitle.size = '2xl'
  leftTitle.text = { fr: 'Contact', en: 'Contact' }
  const leftText = createTextItem('contact-text') as PageBuilderTextItem
  leftText.text = {
    fr: 'Une question sur les paniers, la vente directe ou les horaires ? Utilisez le formulaire ci-dessous pour nous écrire.',
    en: 'A question about baskets, direct sales or opening hours? Use the form below to contact us.'
  }
  const form = createFormItem('contact-form') as PageBuilderFormItem
  form.formKey = 'contact'
  form.title = { fr: 'Nous écrire', en: 'Send us a message' }
  form.intro = {
    fr: 'Les champs marqués d’un astérisque sont obligatoires.',
    en: 'Fields marked with an asterisk are required.'
  }
  form.submitLabel = { fr: 'Envoyer le message', en: 'Send message' }
  form.successMessage = { fr: 'Votre message a été envoyé.', en: 'Your message has been sent.' }
  form.action = {
    type: 'email',
    toMode: 'custom',
    to: '',
    toFieldName: '',
    templateAction: 'contact',
    replyToFieldName: 'email',
    cc: '',
    bcc: ''
  }
  form.rows = [
    {
      id: 'contact-row-1',
      fields: [
        {
          id: 'contact-name',
          name: 'name',
          type: 'text',
          width: 1,
          label: { fr: 'Nom', en: 'Name' },
          placeholder: { fr: 'Votre nom', en: 'Your name' },
          helpText: { fr: '', en: '' },
          required: true,
          defaultValue: '',
          defaultChecked: false,
          regexPattern: '',
          errorMessage: { fr: 'Veuillez renseigner votre nom.', en: 'Please provide your name.' },
          textareaMinLines: 4,
          options: []
        },
        {
          id: 'contact-email',
          name: 'email',
          type: 'email',
          width: 1,
          label: { fr: 'Email', en: 'Email' },
          placeholder: { fr: 'vous@exemple.fr', en: 'you@example.com' },
          helpText: { fr: '', en: '' },
          required: true,
          defaultValue: '',
          defaultChecked: false,
          regexPattern: '',
          errorMessage: { fr: 'Veuillez saisir un email valide.', en: 'Please provide a valid email.' },
          textareaMinLines: 4,
          options: []
        }
      ]
    },
    {
      id: 'contact-row-2',
      fields: [
        {
          id: 'contact-message',
          name: 'message',
          type: 'textarea',
          width: 2,
          label: { fr: 'Message', en: 'Message' },
          placeholder: { fr: 'Décrivez votre demande', en: 'Describe your request' },
          helpText: { fr: '', en: '' },
          required: true,
          defaultValue: '',
          defaultChecked: false,
          regexPattern: '',
          errorMessage: { fr: 'Veuillez saisir un message.', en: 'Please enter a message.' },
          textareaMinLines: 6,
          options: []
        }
      ]
    }
  ]

  const infoCards = createCardsItem('contact-info-cards') as PageBuilderCardsItem
  infoCards.display = 'stack'
  infoCards.cards = [
    {
      id: 'contact-info-1',
      title: { fr: 'Coordonnées', en: 'Contact details' },
      text: { fr: 'Adresse, téléphone et email publics issus des réglages du site.', en: 'Public address, phone and email pulled from site settings.' },
      icon: 'mdi:map-marker-outline',
      elements: [
        {
          id: 'contact-info-1-title',
          kind: 'title',
          source: 'custom',
          icon: '',
          title: { fr: 'Nos coordonnées', en: 'Contact details' },
          text: { fr: '', en: '' },
          titleSize: 'lg',
          textSize: 'sm'
        },
        {
          id: 'contact-info-1-address',
          kind: 'text',
          source: 'address',
          icon: 'mdi:map-marker',
          title: { fr: 'Adresse', en: 'Address' },
          text: { fr: '', en: '' },
          titleSize: 'sm',
          textSize: 'sm'
        },
        {
          id: 'contact-info-1-phone',
          kind: 'text',
          source: 'phone',
          icon: 'mdi:phone',
          title: { fr: 'Téléphone', en: 'Phone' },
          text: { fr: '', en: '' },
          titleSize: 'sm',
          textSize: 'sm'
        },
        {
          id: 'contact-info-1-email',
          kind: 'text',
          source: 'email',
          icon: 'mdi:email',
          title: { fr: 'Email', en: 'Email' },
          text: { fr: '', en: '' },
          titleSize: 'sm',
          textSize: 'sm'
        }
      ],
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
    },
    {
      id: 'contact-info-2',
      title: { fr: 'Horaires', en: 'Opening hours' },
      text: { fr: 'Les horaires de retrait et de vente directe restent synchronisés avec les réglages globaux.', en: 'Pickup and direct sale opening hours stay synced with global settings.' },
      icon: 'mdi:clock-outline',
      elements: [
        {
          id: 'contact-info-2-title',
          kind: 'title',
          source: 'custom',
          icon: '',
          title: { fr: 'Horaires d’ouverture', en: 'Opening hours' },
          text: { fr: '', en: '' },
          titleSize: 'lg',
          textSize: 'sm'
        },
        {
          id: 'contact-info-2-hours',
          kind: 'text',
          source: 'opening-hours',
          icon: 'mdi:clock',
          title: { fr: 'Vente directe à la ferme', en: 'Farm direct sale' },
          text: { fr: '', en: '' },
          titleSize: 'sm',
          textSize: 'sm'
        }
      ],
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
  ]
  introSection.columns[0]?.items.push(leftTitle, leftText, form)
  introSection.columns[1]?.items.push(infoCards)

  return {
    version: 1 as const,
    sections: [introSection]
  }
}

function normalizeCookieService(value: unknown, index: number, fallback: CmsCookieService): CmsCookieService {
  if (!isObject(value)) return fallback
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : fallback.id,
    name: normalizeLocalizedTextWithFallback(value.name, fallback.name),
    description: normalizeLocalizedTextWithFallback(value.description, fallback.description),
    category: isCmsCookieServiceCategory(value.category) ? value.category : fallback.category,
    storage: isCmsCookieServiceStorage(value.storage) ? value.storage : fallback.storage,
    keys: Array.isArray(value.keys)
      ? value.keys.map((entry) => typeof entry === 'string' ? entry.trim() : '').filter(Boolean)
      : fallback.keys,
    required: typeof value.required === 'boolean' ? value.required : fallback.required,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true
  }
}

function normalizeCookieBannerSettings(value: unknown, fallback: CmsCookieBannerSettings): CmsCookieBannerSettings {
  const source = isObject(value) ? value : {}
  const fallbackServices = fallback.services
  return {
    enabled: typeof source.enabled === 'boolean' ? source.enabled : fallback.enabled,
    title: normalizeLocalizedTextWithFallback(source.title, fallback.title),
    text: normalizeLocalizedTextWithFallback(source.text, fallback.text),
    acceptLabel: normalizeLocalizedTextWithFallback(source.acceptLabel, fallback.acceptLabel),
    refuseLabel: normalizeLocalizedTextWithFallback(source.refuseLabel, fallback.refuseLabel),
    customizeLabel: normalizeLocalizedTextWithFallback(source.customizeLabel, fallback.customizeLabel),
    saveLabel: normalizeLocalizedTextWithFallback(source.saveLabel, fallback.saveLabel),
    privacyPagePath: typeof source.privacyPagePath === 'string' && source.privacyPagePath.trim()
      ? normalizePath(source.privacyPagePath)
      : fallback.privacyPagePath,
    cookieName: typeof source.cookieName === 'string' && source.cookieName.trim()
      ? source.cookieName.trim()
      : fallback.cookieName,
    services: Array.isArray(source.services)
      ? source.services.map((service, index) => normalizeCookieService(service, index, fallbackServices[index] ?? fallbackServices[0]!))
      : fallback.services
  }
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

function isCmsHeaderNavigationStyle(value: unknown): value is CmsHeaderNavigationStyle {
  return typeof value === 'string' && CMS_HEADER_NAVIGATION_STYLES.has(value as CmsHeaderNavigationStyle)
}

function isCmsHeaderSubmenuTrigger(value: unknown): value is CmsHeaderSubmenuTrigger {
  return typeof value === 'string' && CMS_HEADER_SUBMENU_TRIGGERS.has(value as CmsHeaderSubmenuTrigger)
}

function isCmsHeaderSubmenuAnimation(value: unknown): value is CmsHeaderSubmenuAnimation {
  return typeof value === 'string' && CMS_HEADER_SUBMENU_ANIMATIONS.has(value as CmsHeaderSubmenuAnimation)
}

function isCmsHeaderMobileLogoPosition(value: unknown): value is CmsHeaderMobileLogoPosition {
  return typeof value === 'string' && CMS_HEADER_MOBILE_LOGO_POSITIONS.has(value as CmsHeaderMobileLogoPosition)
}

function pageRowToPayload(row: CmsPage): CmsPagePayload {
  return {
    path: normalizePath(row.path),
    slug: row.slug,
    pageType: row.pageType as CmsPageType,
    status: row.status as CmsPageStatus,
    specialRole: isCmsPageSpecialRole(row.specialRole) ? row.specialRole : null,
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
  const rawLabels = parseJson<Record<string, unknown>>(row.labelsJson)
  return {
    menu: row.menu as CmsNavigationMenu,
    itemType: row.itemType as CmsNavigationItemType,
    title: row.title,
    labels: normalizeLocalizedText(rawLabels),
    navigationItemKey: normalizeNavigationItemKey(rawLabels?.navigationItemKey, `nav-item-${row.id}`),
    parentItemKey: normalizeParentNavigationItemKey(rawLabels?.parentItemKey),
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
    navigationItemKey: payload.navigationItemKey,
    parentItemKey: payload.parentItemKey,
    href: payload.href,
    newTab: payload.newTab,
    visible: payload.visible,
    position: payload.position,
    children: []
  }
}

function buildResolvedNavigationTree(items: ResolvedCmsNavigationItem[]) {
  const nodes = items.map(item => ({ ...item, children: [] as ResolvedCmsNavigationItem[] }))
  const byKey = new Map(nodes.map(item => [item.navigationItemKey, item]))
  const roots: ResolvedCmsNavigationItem[] = []

  for (const node of nodes) {
    const parent = node.parentItemKey ? byKey.get(node.parentItemKey) : null
    if (!parent || parent.navigationItemKey === node.navigationItemKey) {
      roots.push(node)
      continue
    }

    parent.children.push(node)
  }

  const sortTree = (entries: ResolvedCmsNavigationItem[]) => {
    entries.sort((a, b) => a.position - b.position || a.id - b.id)
    for (const entry of entries) {
      sortTree(entry.children)
    }
  }

  sortTree(roots)
  return roots
}

function isFeatureEnabledForHref(href: string, featureFlags: FeatureFlags) {
  const normalizedHref = href.split('?')[0]?.split('#')[0] || href
  if (normalizedHref === '/paniers' || normalizedHref.startsWith('/paniers/')) {
    return featureFlags.shop.enabled && featureFlags.shop.basketsEnabled
  }
  if (normalizedHref === '/news' || normalizedHref.startsWith('/news/')) {
    return featureFlags.newsEnabled
  }
  if (normalizedHref === '/events' || normalizedHref.startsWith('/events/') || normalizedHref === '/planning' || normalizedHref.startsWith('/planning/')) {
    return featureFlags.eventsEnabled
  }
  return true
}

function filterNavigationItemsByFeatureFlags(items: Array<CmsNavigationItemPayload & { id: number | null }>, featureFlags: FeatureFlags) {
  return items.filter((item) => isFeatureEnabledForHref(item.href, featureFlags))
}

function createLegacyRootResolvedPage(locale: string): Promise<ResolvedCmsPage> {
  return getPageBuilderContent().then((content) => ({
    id: null,
    path: '/',
    slug: 'home',
    pageType: 'CMS',
    status: 'PUBLISHED',
    specialRole: null,
    templateKey: 'default',
    rendererKey: '',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'Home page' : 'Page d’accueil',
    navigationLabel: locale === 'en' ? 'Home page' : 'Page d’accueil',
    seo: {
      metaTitle: locale === 'en' ? 'Home page' : 'Page d’accueil',
      metaDescription: locale === 'en'
        ? 'Edit this page from the CMS to publish your own content.'
        : 'Modifiez cette page depuis le CMS pour publier votre propre contenu.',
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
    specialRole: null,
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
    specialRole: null,
    templateKey: 'default',
    rendererKey: 'news',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'News' : 'Actualités',
    navigationLabel: locale === 'en' ? 'News' : 'Actualités',
    seo: {
      metaTitle: locale === 'en' ? 'Farm news and updates' : 'Actualités de la ferme',
      metaDescription: locale === 'en'
        ? 'Read the latest news, updates and highlights published on the site.'
        : 'Suivez les actualités, les nouveautés et les temps forts publiés sur le site.',
      ogImage: '',
      noindex: false
    },
    content: createEmptyPageBuilderContent()
  }
}

function createLegacyEventsResolvedPage(locale: string): ResolvedCmsPage {
  return {
    id: null,
    path: '/events',
    slug: 'events',
    pageType: 'APPLICATION',
    status: 'PUBLISHED',
    specialRole: null,
    templateKey: 'default',
    rendererKey: 'events',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'Events' : 'Événements',
    navigationLabel: locale === 'en' ? 'Events' : 'Événements',
    seo: {
      metaTitle: locale === 'en' ? 'Upcoming events' : 'Événements à venir',
      metaDescription: locale === 'en'
        ? 'Browse upcoming events, public reservations and internal participation calls.'
        : 'Consultez les événements à venir, les réservations publiques et les appels à participation.',
      ogImage: '',
      noindex: false
    },
    content: createEmptyPageBuilderContent()
  }
}

function createLegacyPlanningResolvedPage(locale: string): ResolvedCmsPage {
  return {
    id: null,
    path: '/planning',
    slug: 'planning',
    pageType: 'APPLICATION',
    status: 'PUBLISHED',
    specialRole: null,
    templateKey: 'default',
    rendererKey: 'planning',
    applicationPosition: 'AFTER_CONTENT',
    title: locale === 'en' ? 'Schedule' : 'Planning',
    navigationLabel: locale === 'en' ? 'Schedule' : 'Planning',
    seo: {
      metaTitle: locale === 'en' ? 'Farm schedule' : 'Planning de la ferme',
      metaDescription: locale === 'en'
        ? 'Browse the farm schedule, public events and volunteer information.'
        : 'Consultez le planning de la ferme, les événements publics et les informations bénévoles.',
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
            mobileHeightPx: typeof parsed.header.mobileHeightPx === 'number' ? Math.max(56, Math.min(160, Math.round(parsed.header.mobileHeightPx))) : fallback.header.mobileHeightPx,
            mobileLogoHeightPx: typeof parsed.header.mobileLogoHeightPx === 'number' ? Math.max(24, Math.min(120, Math.round(parsed.header.mobileLogoHeightPx))) : fallback.header.mobileLogoHeightPx,
            showSiteName: typeof parsed.header.showSiteName === 'boolean' ? parsed.header.showSiteName : fallback.header.showSiteName,
            showSiteTagline: typeof parsed.header.showSiteTagline === 'boolean' ? parsed.header.showSiteTagline : fallback.header.showSiteTagline,
            mobileHeaderShowSiteName: typeof parsed.header.mobileHeaderShowSiteName === 'boolean'
              ? parsed.header.mobileHeaderShowSiteName
              : (typeof parsed.header.mobileShowSiteName === 'boolean' ? parsed.header.mobileShowSiteName : fallback.header.mobileHeaderShowSiteName),
            mobileHeaderShowSiteTagline: typeof parsed.header.mobileHeaderShowSiteTagline === 'boolean'
              ? parsed.header.mobileHeaderShowSiteTagline
              : (typeof parsed.header.mobileShowSiteTagline === 'boolean' ? parsed.header.mobileShowSiteTagline : fallback.header.mobileHeaderShowSiteTagline),
            mobileHeaderLogoPosition: isCmsHeaderMobileLogoPosition(parsed.header.mobileHeaderLogoPosition)
              ? parsed.header.mobileHeaderLogoPosition
              : (isCmsHeaderMobileLogoPosition(parsed.header.mobileLogoPosition) ? parsed.header.mobileLogoPosition : fallback.header.mobileHeaderLogoPosition),
            mobileMenuShowSiteName: typeof parsed.header.mobileMenuShowSiteName === 'boolean'
              ? parsed.header.mobileMenuShowSiteName
              : (typeof parsed.header.mobileShowSiteName === 'boolean' ? parsed.header.mobileShowSiteName : fallback.header.mobileMenuShowSiteName),
            mobileMenuShowSiteTagline: typeof parsed.header.mobileMenuShowSiteTagline === 'boolean'
              ? parsed.header.mobileMenuShowSiteTagline
              : (typeof parsed.header.mobileShowSiteTagline === 'boolean' ? parsed.header.mobileShowSiteTagline : fallback.header.mobileMenuShowSiteTagline),
            mobileMenuLogoPosition: isCmsHeaderMobileLogoPosition(parsed.header.mobileMenuLogoPosition)
              ? parsed.header.mobileMenuLogoPosition
              : (isCmsHeaderMobileLogoPosition(parsed.header.mobileLogoPosition) ? parsed.header.mobileLogoPosition : fallback.header.mobileMenuLogoPosition),
            mobileBurgerPosition: isCmsHeaderMobileLogoPosition(parsed.header.mobileBurgerPosition)
              ? parsed.header.mobileBurgerPosition
              : fallback.header.mobileBurgerPosition,
            showPrimaryNavigation: typeof parsed.header.showPrimaryNavigation === 'boolean' ? parsed.header.showPrimaryNavigation : fallback.header.showPrimaryNavigation,
            navigationStyle: isCmsHeaderNavigationStyle(parsed.header.navigationStyle)
              ? parsed.header.navigationStyle
              : fallback.header.navigationStyle,
            submenuTrigger: isCmsHeaderSubmenuTrigger(parsed.header.submenuTrigger) ? parsed.header.submenuTrigger : fallback.header.submenuTrigger,
            submenuAnimation: isCmsHeaderSubmenuAnimation(parsed.header.submenuAnimation) ? parsed.header.submenuAnimation : fallback.header.submenuAnimation,
            submenuRadiusPx: typeof parsed.header.submenuRadiusPx === 'number' ? Math.max(0, Math.min(40, Math.round(parsed.header.submenuRadiusPx))) : fallback.header.submenuRadiusPx,
            backgroundColor: normalizeThemeColorSelection(parsed.header.backgroundColor, fallback.header.backgroundColor || createThemeColorSelection('base-100')),
            textColor: normalizeThemeColorSelection(parsed.header.textColor, fallback.header.textColor || createThemeColorSelection('base-content')),
            navigationActiveBackgroundColor: normalizeThemeColorSelection(parsed.header.navigationActiveBackgroundColor, fallback.header.navigationActiveBackgroundColor || createThemeColorSelection('primary')),
            navigationActiveTextColor: normalizeThemeColorSelection(parsed.header.navigationActiveTextColor, fallback.header.navigationActiveTextColor || createThemeColorSelection('primary-content')),
            navigationHoverBackgroundColor: normalizeThemeColorSelection(parsed.header.navigationHoverBackgroundColor, fallback.header.navigationHoverBackgroundColor || createThemeColorSelection('base-200')),
            navigationHoverTextColor: normalizeThemeColorSelection(parsed.header.navigationHoverTextColor, fallback.header.navigationHoverTextColor || createThemeColorSelection('base-content')),
            submenuBackgroundColor: normalizeThemeColorSelection(parsed.header.submenuBackgroundColor, fallback.header.submenuBackgroundColor || createThemeColorSelection('base-100')),
            submenuTextColor: normalizeThemeColorSelection(parsed.header.submenuTextColor, fallback.header.submenuTextColor || createThemeColorSelection('base-content')),
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
      : fallback.newsPage,
    eventsPage: isObject(parsed.eventsPage)
      ? normalizeEventsPageSettings(parsed.eventsPage, fallback.eventsPage)
      : fallback.eventsPage,
    planningPage: isObject(parsed.planningPage)
      ? normalizePlanningPageSettings(parsed.planningPage, fallback.planningPage)
      : fallback.planningPage,
    cookieBanner: normalizeCookieBannerSettings(parsed.cookieBanner, fallback.cookieBanner)
  }
}

function normalizeEventsPageSettings(value: unknown, fallback: CmsEventsPageSettings): CmsEventsPageSettings {
  if (!isObject(value)) return fallback
  const enabledViews = Array.isArray(value.enabledViews)
    ? value.enabledViews.filter((entry): entry is CmsEventsPageSettings['enabledViews'][number] =>
        entry === 'list' || entry === 'grid')
    : fallback.enabledViews

  const defaultViewMode = value.defaultViewMode === 'list' || value.defaultViewMode === 'grid'
    ? value.defaultViewMode
    : fallback.defaultViewMode

  return {
    title: normalizeLocalizedText(value.title),
    subtitle: normalizeLocalizedText(value.subtitle),
    containerWidth: typeof value.containerWidth === 'string' ? value.containerWidth as CmsEventsPageSettings['containerWidth'] : fallback.containerWidth,
    defaultViewMode,
    enabledViews: enabledViews.length ? Array.from(new Set(enabledViews)) : fallback.enabledViews,
    gridColumns: normalizeGridColumns(value.gridColumns, fallback.gridColumns, 3) as 1 | 2 | 3,
    showViewToggle: typeof value.showViewToggle === 'boolean' ? value.showViewToggle : fallback.showViewToggle,
    showCoverImage: typeof value.showCoverImage === 'boolean' ? value.showCoverImage : fallback.showCoverImage,
    showDate: typeof value.showDate === 'boolean' ? value.showDate : fallback.showDate,
    showLocation: typeof value.showLocation === 'boolean' ? value.showLocation : fallback.showLocation,
    showExcerpt: typeof value.showExcerpt === 'boolean' ? value.showExcerpt : fallback.showExcerpt,
    excerptLines: [2, 3, 4].includes(Number(value.excerptLines)) ? Number(value.excerptLines) as 2 | 3 | 4 : fallback.excerptLines,
    cardBackgroundColor: normalizeThemeColorSelection(value.cardBackgroundColor, fallback.cardBackgroundColor || createThemeColorSelection('base-200')),
    publicReservationLabel: normalizeLocalizedTextWithFallback(value.publicReservationLabel, fallback.publicReservationLabel),
    internalParticipationLabel: normalizeLocalizedTextWithFallback(value.internalParticipationLabel, fallback.internalParticipationLabel),
    detailLabel: normalizeLocalizedTextWithFallback(value.detailLabel, fallback.detailLabel)
  }
}

function normalizePlanningPageSettings(value: unknown, fallback: CmsPlanningPageSettings): CmsPlanningPageSettings {
  if (!isObject(value)) return fallback
  const enabledViews = Array.isArray(value.enabledViews)
    ? value.enabledViews.filter((entry): entry is CmsPlanningPageSettings['enabledViews'][number] =>
        entry === 'week' || entry === 'calendar')
    : fallback.enabledViews

  const defaultViewMode = value.defaultViewMode === 'week' || value.defaultViewMode === 'calendar'
    ? value.defaultViewMode
    : fallback.defaultViewMode

  return {
    title: normalizeLocalizedText(value.title),
    subtitle: normalizeLocalizedText(value.subtitle),
    containerWidth: typeof value.containerWidth === 'string' ? value.containerWidth as CmsPlanningPageSettings['containerWidth'] : fallback.containerWidth,
    defaultViewMode,
    enabledViews: enabledViews.length ? Array.from(new Set(enabledViews)) : fallback.enabledViews,
    showViewToggle: typeof value.showViewToggle === 'boolean' ? value.showViewToggle : fallback.showViewToggle,
    showCoverImage: typeof value.showCoverImage === 'boolean' ? value.showCoverImage : fallback.showCoverImage,
    showDate: typeof value.showDate === 'boolean' ? value.showDate : fallback.showDate,
    showLocation: typeof value.showLocation === 'boolean' ? value.showLocation : fallback.showLocation,
    showExcerpt: typeof value.showExcerpt === 'boolean' ? value.showExcerpt : fallback.showExcerpt,
    excerptLines: [2, 3, 4].includes(Number(value.excerptLines)) ? Number(value.excerptLines) as 2 | 3 | 4 : fallback.excerptLines,
    cardBackgroundColor: normalizeThemeColorSelection(value.cardBackgroundColor, fallback.cardBackgroundColor || createThemeColorSelection('base-200')),
    detailLabel: normalizeLocalizedTextWithFallback(value.detailLabel, fallback.detailLabel),
    becomeVolunteerLabel: normalizeLocalizedTextWithFallback(value.becomeVolunteerLabel, fallback.becomeVolunteerLabel),
    internalParticipationLabel: normalizeLocalizedTextWithFallback(value.internalParticipationLabel, fallback.internalParticipationLabel),
    guestInfoLabel: normalizeLocalizedTextWithFallback(value.guestInfoLabel, fallback.guestInfoLabel)
  }
}

export async function saveCmsSiteSettings(settings: CmsSiteSettings) {
  await setSetting(SETTING_KEYS.CMS_SITE_SETTINGS, JSON.stringify(settings))

  const { syncImageUsageTable } = await import('./imageReferences')
  await syncImageUsageTable()
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

export async function getCmsSpecialPagePath(role: CmsPageSpecialRole) {
  await ensureCmsSystemPages()
  const row = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({
      where: {
        specialRole: role,
        status: 'PUBLISHED'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    }),
    async () => null
  )

  if (row?.path) {
    return normalizePath(row.path)
  }

  return role === 'construction' ? '/construction' : null
}

export async function ensureCmsRootPage() {
  const existing = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({
      where: {
        OR: [
          { path: '/' },
          { slug: 'home' }
        ]
      }
    }),
    async () => null
  )

  const rootPageContent = await getPageBuilderContent()
  const rootPayload: CmsPagePayload = {
    ...createDefaultCmsPagePayload('/', 'Page d’accueil'),
    path: '/',
    slug: 'home',
    status: 'PUBLISHED',
    title: 'Page d’accueil',
    translations: {
      fr: {
        title: 'Page d’accueil',
        navigationLabel: 'Page d’accueil',
        seo: {
          metaTitle: 'Page d’accueil',
          metaDescription: 'Modifiez cette page depuis le CMS pour publier votre propre contenu.',
          ogImage: '',
          noindex: false
        },
        content: rootPageContent
      },
      en: {
        title: 'Home page',
        navigationLabel: 'Home page',
        seo: {
          metaTitle: 'Home page',
          metaDescription: 'Edit this page from the CMS to publish your own content.',
          ogImage: '',
          noindex: false
        },
        content: rootPageContent
      }
    }
  }

  if (existing) {
    const payload = pageRowToPayload(existing)
    if (payload.path === '/' && payload.slug === 'home') {
      return existing.id
    }
  }

  const created = await saveCmsPage(existing?.id ?? null, rootPayload)

  return created?.id ?? null
}

async function ensureCmsApplicationPage(path: string, slug: string, titleFr: string, titleEn: string, rendererKey: string) {
  const existing = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({
      where: {
        OR: [
          { path },
          { slug },
          {
            pageType: 'APPLICATION',
            rendererKey
          }
        ]
      }
    }),
    async () => null
  )

  const applicationPayload: CmsPagePayload = {
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
  }

  if (existing) {
    const payload = pageRowToPayload(existing)
    if (
      payload.path === path
      && payload.slug === slug
      && payload.pageType === 'APPLICATION'
      && payload.rendererKey === rendererKey
    ) {
      return existing.id
    }
  }

  const created = await saveCmsPage(existing?.id ?? null, applicationPayload)

  return created?.id ?? null
}

async function ensureCmsStandardPage(options: {
  path: string
  slug: string
  titleFr: string
  titleEn: string
  seoFr: CmsPageSeo
  seoEn: CmsPageSeo
  content: PageBuilderContent
  specialRole?: CmsPageSpecialRole | null
}) {
  const existing = await withCmsTableFallback(
    () => prisma.cmsPage.findFirst({
      where: {
        OR: [
          { path: options.path },
          ...(options.specialRole ? [{ specialRole: options.specialRole }] : [])
        ]
      }
    }),
    async () => null
  )

  if (existing) {
    const payload = pageRowToPayload(existing)
    if (payload.path === options.path && payload.specialRole === (options.specialRole ?? null)) {
      return existing.id
    }
  }

  const created = await saveCmsPage(existing?.id ?? null, {
    ...createDefaultCmsPagePayload(options.path, options.titleFr),
    path: options.path,
    slug: options.slug,
    pageType: 'CMS',
    status: 'PUBLISHED',
    specialRole: options.specialRole ?? null,
    title: options.titleFr,
    translations: {
      fr: {
        title: options.titleFr,
        navigationLabel: options.titleFr,
        seo: options.seoFr,
        content: options.content
      },
      en: {
        title: options.titleEn,
        navigationLabel: options.titleEn,
        seo: options.seoEn,
        content: options.content
      }
    }
  })

  return created?.id ?? null
}

export async function ensureCmsSystemPages() {
  await ensureCmsRootPage()
  await ensureCmsApplicationPage('/paniers', 'paniers', 'Paniers', 'Baskets', 'baskets')
  await ensureCmsApplicationPage('/news', 'news', 'Actualités', 'News', 'news')
  await ensureCmsApplicationPage('/events', 'events', 'Événements', 'Events', 'events')
  await ensureCmsApplicationPage('/planning', 'planning', 'Planning', 'Schedule', 'planning')
  await ensureCmsStandardPage({
    path: '/construction',
    slug: 'construction',
    titleFr: 'Site en construction',
    titleEn: 'Site under construction',
    specialRole: 'construction',
    seoFr: {
      metaTitle: 'Site en construction',
      metaDescription: 'Le site public est momentanément en préparation.',
      ogImage: '',
      noindex: true
    },
    seoEn: {
      metaTitle: 'Site under construction',
      metaDescription: 'The public site is currently being prepared.',
      ogImage: '',
      noindex: true
    },
    content: createDefaultConstructionPageContent()
  })
  await ensureCmsStandardPage({
    path: '/contact',
    slug: 'contact',
    titleFr: 'Contact',
    titleEn: 'Contact',
    seoFr: {
      metaTitle: 'Contact',
      metaDescription: 'Contactez la Ferme du Campeyrigoux pour vos questions, paniers et horaires.',
      ogImage: '',
      noindex: false
    },
    seoEn: {
      metaTitle: 'Contact',
      metaDescription: 'Contact Ferme du Campeyrigoux for questions, baskets and opening hours.',
      ogImage: '',
      noindex: false
    },
    content: createDefaultContactPageContent()
  })
  await ensureCmsStandardPage({
    path: '/terms',
    slug: 'terms',
    titleFr: 'Conditions d’utilisation',
    titleEn: 'Terms of use',
    seoFr: {
      metaTitle: 'Conditions d’utilisation',
      metaDescription: 'Consultez les conditions d’utilisation applicables aux services numériques de la Ferme du Campeyrigoux.',
      ogImage: '',
      noindex: false
    },
    seoEn: {
      metaTitle: 'Terms of use',
      metaDescription: 'Read the terms of use for the Ferme du Campeyrigoux digital services.',
      ogImage: '',
      noindex: false
    },
    content: createDefaultLegalPageContent({
      sectionId: 'terms',
      title: { fr: 'Conditions d’utilisation', en: 'Terms of use' },
      intro: { fr: 'Dernière mise à jour : 25/04/2026', en: 'Last update: 2026-04-25' },
      blocks: [
        {
          title: { fr: 'Acceptation des conditions', en: 'Acceptance of terms' },
          text: { fr: 'En utilisant ce site, vous acceptez les présentes conditions d’utilisation.', en: 'By using this website, you agree to these terms of use.' }
        },
        {
          title: { fr: 'Description du service', en: 'Service description' },
          text: { fr: 'Le site présente les activités de la ferme et permet certains contacts ou réservations.', en: 'The site presents the farm activities and allows some contact or reservation workflows.' }
        },
        {
          title: { fr: 'Responsabilités de l’utilisateur', en: 'User responsibilities' },
          text: { fr: 'Vous êtes responsable des informations transmises via le site et du respect des règles applicables.', en: 'You are responsible for the information sent through the site and for complying with applicable rules.' }
        }
      ]
    })
  })
  await ensureCmsStandardPage({
    path: '/privacy',
    slug: 'privacy',
    titleFr: 'Politique de confidentialité',
    titleEn: 'Privacy policy',
    seoFr: {
      metaTitle: 'Politique de confidentialité',
      metaDescription: 'Consultez la politique de confidentialité relative aux services numériques de la Ferme du Campeyrigoux.',
      ogImage: '',
      noindex: false
    },
    seoEn: {
      metaTitle: 'Privacy policy',
      metaDescription: 'Read the privacy policy for the Ferme du Campeyrigoux digital services.',
      ogImage: '',
      noindex: false
    },
    content: createDefaultLegalPageContent({
      sectionId: 'privacy',
      title: { fr: 'Politique de confidentialité', en: 'Privacy policy' },
      intro: { fr: 'Dernière mise à jour : 25/04/2026', en: 'Last update: 2026-04-25' },
      blocks: [
        {
          title: { fr: 'Collecte des données', en: 'Data collection' },
          text: { fr: 'Le site collecte uniquement les données nécessaires au fonctionnement des formulaires, de la langue et des intégrations activées.', en: 'The site only collects the data required for forms, language handling and enabled integrations.' }
        },
        {
          title: { fr: 'Utilisation des données', en: 'Use of data' },
          text: { fr: 'Les données servent à traiter vos demandes, administrer le site et améliorer son fonctionnement.', en: 'Data is used to handle your requests, administer the site and improve operations.' }
        },
        {
          title: { fr: 'Vos droits', en: 'Your rights' },
          text: { fr: 'Vous pouvez nous contacter pour toute demande liée à vos données ou à vos préférences.', en: 'You can contact us for any request related to your data or preferences.' }
        }
      ]
    })
  })
}

export async function bootstrapCmsPageFromResolvedPage(resolvedPage: ResolvedCmsPage, locale: CmsLocale) {
  if (resolvedPage.path === '/' || resolvedPage.path === '/paniers' || resolvedPage.path === '/news' || resolvedPage.path === '/events' || resolvedPage.path === '/planning' || resolvedPage.path === '/construction' || resolvedPage.path === '/contact' || resolvedPage.path === '/terms' || resolvedPage.path === '/privacy') {
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
  await ensureFormEmailTemplateActions(payload)
  const normalizedPath = normalizePath(payload.path)
  const translations = synchronizeSharedPageContent(payload.translations)
  const data = {
    path: normalizedPath,
    slug: payload.slug,
    title: payload.title,
    pageType: payload.pageType,
    status: payload.status,
    specialRole: payload.specialRole ?? null,
    templateKey: payload.templateKey || 'default',
    rendererKey: payload.rendererKey || null,
    applicationPosition: payload.applicationPosition,
    translationsJson: JSON.stringify(translations)
  }

  if (payload.specialRole) {
    await withCmsTableFallback(() => prisma.cmsPage.updateMany({
      where: {
        specialRole: payload.specialRole,
        ...(id ? { NOT: { id } } : {})
      },
      data: {
        specialRole: null
      }
    }), async () => ({ count: 0 }))
  }

  if (id) {
    const existing = await withCmsTableFallback(
      () => prisma.cmsPage.findUnique({ where: { id } }),
      async () => null
    )
    if (!existing) return null

    const updated = await withCmsTableFallback(
      () => prisma.cmsPage.update({
        where: { id },
        data
      }),
      async () => null
    )
    if (updated) {
      const { syncImageUsageTable } = await import('./imageReferences')
      await syncImageUsageTable()
    }
    return updated
  }

  const created = await withCmsTableFallback(
    () => prisma.cmsPage.create({
      data
    }),
    async () => null
  )
  if (created) {
    const { syncImageUsageTable } = await import('./imageReferences')
    await syncImageUsageTable()
  }
  return created
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

  const { syncImageUsageTable } = await import('./imageReferences')
  await syncImageUsageTable()
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
      labelsJson: JSON.stringify({
        ...item.labels,
        navigationItemKey: item.navigationItemKey,
        parentItemKey: item.parentItemKey
      }),
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

async function getResolvedNavigation(menu: CmsNavigationMenu, locale: string, featureFlags: FeatureFlags) {
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

  const filteredRows = filterNavigationItemsByFeatureFlags(
    rows.map((row) => ({ id: row.id, ...navigationRowToPayload(row) })),
    featureFlags
  )

  if (!filteredRows.length) {
    return buildResolvedNavigationTree(mergeMissingDefaultNavigationItems(
      createDefaultCmsNavigationItems()
        .filter((item) => item.menu === menu && item.visible)
        .map((item) => ({ id: null, ...item }))
        .filter((item) => isFeatureEnabledForHref(item.href, featureFlags)),
      menu
    ).map((row, index) => navigationPayloadToResolved(row.id ?? -(index + 1), row, locale)))
  }

  return buildResolvedNavigationTree(mergeMissingDefaultNavigationItems(
    filteredRows,
    menu
  ).map((row, index) => navigationPayloadToResolved(row.id ?? -(index + 1), row, locale)))
}

export async function getPublicSiteShell(locale: string, featureFlags: FeatureFlags): Promise<PublicSiteShell> {
  const [settings, primary, footer] = await Promise.all([
    getCmsSiteSettings(),
    getResolvedNavigation('PRIMARY', locale, featureFlags),
    getResolvedNavigation('FOOTER', locale, featureFlags)
  ])

  return {
    settings,
    socialLinks: settings.socialLinks,
    navigation: {
      primary: primary.sort((a, b) => a.position - b.position),
      footer: footer.sort((a, b) => a.position - b.position)
    }
  }
}

function isRendererEnabled(rendererKey: string, featureFlags: FeatureFlags) {
  if (rendererKey === 'baskets') {
    return featureFlags.shop.enabled && featureFlags.shop.basketsEnabled
  }
  if (rendererKey === 'news') {
    return featureFlags.newsEnabled
  }
  if (rendererKey === 'events' || rendererKey === 'planning') {
    return featureFlags.eventsEnabled
  }
  if (rendererKey === 'shop') {
    return featureFlags.shop.enabled && (featureFlags.shop.basketsEnabled || featureFlags.shop.vegetablesEnabled)
  }
  return true
}

export async function resolvePublicCmsPage(path: string, locale: string, includeDraft = false, featureFlags: FeatureFlags): Promise<ResolvedCmsPage | null> {
  await ensureCmsSystemPages()
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
    if (!isRendererEnabled(payload.rendererKey, featureFlags)) {
      return null
    }
    const localized = pickTranslation(locale, payload.translations)

    return {
      id: row.id,
      path: payload.path,
      slug: payload.slug,
      pageType: payload.pageType,
      status: payload.status,
      specialRole: payload.specialRole ?? null,
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
    if (!isRendererEnabled('baskets', featureFlags)) {
      return null
    }
    return createLegacyBasketsResolvedPage(locale)
  }

  if (normalizedPath === '/news') {
    if (!isRendererEnabled('news', featureFlags)) {
      return null
    }
    return createLegacyNewsResolvedPage(locale)
  }

  if (normalizedPath === '/events') {
    if (!isRendererEnabled('events', featureFlags)) {
      return null
    }
    return createLegacyEventsResolvedPage(locale)
  }

  if (normalizedPath === '/planning') {
    if (!isRendererEnabled('planning', featureFlags)) {
      return null
    }
    return createLegacyPlanningResolvedPage(locale)
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
    specialRole: isCmsPageSpecialRole(value.specialRole) ? value.specialRole : null,
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
  const eventsPageValue = isObject(value.eventsPage) ? value.eventsPage : {}
  const planningPageValue = isObject(value.planningPage) ? value.planningPage : {}
  const cookieBannerValue = isObject(value.cookieBanner) ? value.cookieBanner : {}

  return {
    siteName: normalizeLocalizedText(value.siteName),
    siteTagline: normalizeLocalizedText(value.siteTagline),
    logo: normalizeImageAsset(logoValue, fallback.logo),
    favicon: normalizeImageAsset(faviconValue, fallback.favicon),
    header: {
      heightPx: typeof headerValue.heightPx === 'number' ? Math.max(56, Math.min(180, Math.round(headerValue.heightPx))) : fallback.header.heightPx,
      logoHeightPx: typeof headerValue.logoHeightPx === 'number' ? Math.max(24, Math.min(140, Math.round(headerValue.logoHeightPx))) : fallback.header.logoHeightPx,
      mobileHeightPx: typeof headerValue.mobileHeightPx === 'number' ? Math.max(56, Math.min(160, Math.round(headerValue.mobileHeightPx))) : fallback.header.mobileHeightPx,
      mobileLogoHeightPx: typeof headerValue.mobileLogoHeightPx === 'number' ? Math.max(24, Math.min(120, Math.round(headerValue.mobileLogoHeightPx))) : fallback.header.mobileLogoHeightPx,
      showSiteName: typeof headerValue.showSiteName === 'boolean' ? headerValue.showSiteName : fallback.header.showSiteName,
      showSiteTagline: typeof headerValue.showSiteTagline === 'boolean' ? headerValue.showSiteTagline : fallback.header.showSiteTagline,
      mobileHeaderShowSiteName: typeof headerValue.mobileHeaderShowSiteName === 'boolean'
        ? headerValue.mobileHeaderShowSiteName
        : (typeof headerValue.mobileShowSiteName === 'boolean' ? headerValue.mobileShowSiteName : fallback.header.mobileHeaderShowSiteName),
      mobileHeaderShowSiteTagline: typeof headerValue.mobileHeaderShowSiteTagline === 'boolean'
        ? headerValue.mobileHeaderShowSiteTagline
        : (typeof headerValue.mobileShowSiteTagline === 'boolean' ? headerValue.mobileShowSiteTagline : fallback.header.mobileHeaderShowSiteTagline),
      mobileHeaderLogoPosition: isCmsHeaderMobileLogoPosition(headerValue.mobileHeaderLogoPosition)
        ? headerValue.mobileHeaderLogoPosition
        : (isCmsHeaderMobileLogoPosition(headerValue.mobileLogoPosition) ? headerValue.mobileLogoPosition : fallback.header.mobileHeaderLogoPosition),
      mobileMenuShowSiteName: typeof headerValue.mobileMenuShowSiteName === 'boolean'
        ? headerValue.mobileMenuShowSiteName
        : (typeof headerValue.mobileShowSiteName === 'boolean' ? headerValue.mobileShowSiteName : fallback.header.mobileMenuShowSiteName),
      mobileMenuShowSiteTagline: typeof headerValue.mobileMenuShowSiteTagline === 'boolean'
        ? headerValue.mobileMenuShowSiteTagline
        : (typeof headerValue.mobileShowSiteTagline === 'boolean' ? headerValue.mobileShowSiteTagline : fallback.header.mobileMenuShowSiteTagline),
      mobileMenuLogoPosition: isCmsHeaderMobileLogoPosition(headerValue.mobileMenuLogoPosition)
        ? headerValue.mobileMenuLogoPosition
        : (isCmsHeaderMobileLogoPosition(headerValue.mobileLogoPosition) ? headerValue.mobileLogoPosition : fallback.header.mobileMenuLogoPosition),
      mobileBurgerPosition: isCmsHeaderMobileLogoPosition(headerValue.mobileBurgerPosition)
        ? headerValue.mobileBurgerPosition
        : fallback.header.mobileBurgerPosition,
      showPrimaryNavigation: typeof headerValue.showPrimaryNavigation === 'boolean' ? headerValue.showPrimaryNavigation : fallback.header.showPrimaryNavigation,
      navigationStyle: isCmsHeaderNavigationStyle(headerValue.navigationStyle)
        ? headerValue.navigationStyle
        : fallback.header.navigationStyle,
      submenuTrigger: isCmsHeaderSubmenuTrigger(headerValue.submenuTrigger) ? headerValue.submenuTrigger : fallback.header.submenuTrigger,
      submenuAnimation: isCmsHeaderSubmenuAnimation(headerValue.submenuAnimation) ? headerValue.submenuAnimation : fallback.header.submenuAnimation,
      submenuRadiusPx: typeof headerValue.submenuRadiusPx === 'number' ? Math.max(0, Math.min(40, Math.round(headerValue.submenuRadiusPx))) : fallback.header.submenuRadiusPx,
      backgroundColor: normalizeThemeColorSelection(headerValue.backgroundColor, fallback.header.backgroundColor || createThemeColorSelection('base-100')),
      textColor: normalizeThemeColorSelection(headerValue.textColor, fallback.header.textColor || createThemeColorSelection('base-content')),
      navigationActiveBackgroundColor: normalizeThemeColorSelection(headerValue.navigationActiveBackgroundColor, fallback.header.navigationActiveBackgroundColor || createThemeColorSelection('primary')),
      navigationActiveTextColor: normalizeThemeColorSelection(headerValue.navigationActiveTextColor, fallback.header.navigationActiveTextColor || createThemeColorSelection('primary-content')),
      navigationHoverBackgroundColor: normalizeThemeColorSelection(headerValue.navigationHoverBackgroundColor, fallback.header.navigationHoverBackgroundColor || createThemeColorSelection('base-200')),
      navigationHoverTextColor: normalizeThemeColorSelection(headerValue.navigationHoverTextColor, fallback.header.navigationHoverTextColor || createThemeColorSelection('base-content')),
      submenuBackgroundColor: normalizeThemeColorSelection(headerValue.submenuBackgroundColor, fallback.header.submenuBackgroundColor || createThemeColorSelection('base-100')),
      submenuTextColor: normalizeThemeColorSelection(headerValue.submenuTextColor, fallback.header.submenuTextColor || createThemeColorSelection('base-content')),
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
    },
    eventsPage: normalizeEventsPageSettings(eventsPageValue, fallback.eventsPage),
    planningPage: normalizePlanningPageSettings(planningPageValue, fallback.planningPage),
    cookieBanner: normalizeCookieBannerSettings(cookieBannerValue, fallback.cookieBanner)
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
      navigationItemKey: normalizeNavigationItemKey(item.navigationItemKey, createNavigationItemKey(index)),
      parentItemKey: normalizeParentNavigationItemKey(item.parentItemKey),
      href: typeof item.href === 'string' && item.href.trim() ? item.href.trim() : '/',
      pageId: typeof item.pageId === 'number' ? item.pageId : null,
      newTab: typeof item.newTab === 'boolean' ? item.newTab : false,
      visible: typeof item.visible === 'boolean' ? item.visible : true,
      position: typeof item.position === 'number' ? item.position : index
    }))
}

const CMS_PAGE_TYPES = new Set<CmsPageType>(['CMS', 'APPLICATION', 'HYBRID'])
const CMS_PAGE_STATUSES = new Set<CmsPageStatus>(['DRAFT', 'PUBLISHED'])
const CMS_PAGE_SPECIAL_ROLES = new Set<CmsPageSpecialRole>(['construction'])
const CMS_APPLICATION_POSITIONS = new Set<CmsApplicationPosition>(['BEFORE_CONTENT', 'AFTER_CONTENT'])
const CMS_NAVIGATION_MENUS = new Set<CmsNavigationMenu>(['PRIMARY', 'FOOTER'])
const CMS_NAVIGATION_ITEM_TYPES = new Set<CmsNavigationItemType>(['CMS_PAGE', 'APPLICATION_ROUTE', 'EXTERNAL_URL'])
const CMS_HEADER_NAVIGATION_STYLES = new Set<CmsHeaderNavigationStyle>(['ghost', 'soft', 'outline', 'solid', 'menu', 'underline'])
const CMS_HEADER_SUBMENU_TRIGGERS = new Set<CmsHeaderSubmenuTrigger>(['hover', 'click'])
const CMS_HEADER_SUBMENU_ANIMATIONS = new Set<CmsHeaderSubmenuAnimation>(['none', 'fade', 'scale', 'slide'])
const CMS_HEADER_MOBILE_LOGO_POSITIONS = new Set<CmsHeaderMobileLogoPosition>(['left', 'right'])
const CMS_COOKIE_SERVICE_CATEGORIES = new Set<CmsCookieServiceCategory>(['essential', 'preferences', 'third_party', 'marketing'])
const CMS_COOKIE_SERVICE_STORAGES = new Set<CmsCookieServiceStorage>(['cookie', 'localStorage', 'sessionStorage', 'script'])
