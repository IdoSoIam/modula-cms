import { readFile } from 'node:fs/promises'
import path from 'node:path'
import fs from 'node:fs'
import cmsProjectConfig from '#modula/cms.project.config'
import { prisma } from '#modula/prisma/client'
import type {
  CmsCookieBannerSettings,
  CmsLocale,
  CmsLocalizedText,
  CmsNavigationItemPayload,
  CmsPagePayload,
  CmsSiteSettings,
  CmsSiteSettingsTemplatePayload
} from '#modula/shared/cms'
import {
  createDefaultCmsNavigationItems,
  createDefaultCmsPagePayload,
  createDefaultCmsSiteSettings,
  createEmptyCmsPageSeo,
  createEmptyPageBuilderContent
} from '#modula/shared/cms'
import {
  createBadgeItem,
  createButtonsItem,
  createCardsItem,
  createEmptyCardElement,
  createEmptyColumnsSection,
  createFormItem,
  createImageItem,
  createTextItem,
  createThemeColorSelection,
  createTitleItem,
  type PageBuilderCard,
  type PageBuilderContent
} from '#modula/shared/pageBuilder'
import type { CmsRegistryTemplateSnapshot } from '#modula/shared/registry'
import {
  FALLBACK_SITE_TEMPLATE_KEY,
  type BundledSystemSiteTemplateKey,
  type CmsSiteTemplateKey
} from '#modula/shared/siteTemplates'
import { applyRegistryTemplate, exportTemplateAssets, listMergedSiteTemplates } from '#modula/server/utils/cmsRegistry'
import { ensureCmsRootPage, ensureCmsSystemPages, getCmsPageByPath, getCmsSiteSettings, saveCmsNavigationItems, saveCmsPage, saveCmsSiteSettings } from '#modula/server/utils/cms'
import { putUploadObject } from '#modula/server/utils/uploadStorage'
import { saveDaisyUiThemeConfig } from '#modula/server/utils/themes'
import type { DaisyUiThemeConfig } from '#modula/shared/themes'
import { getSetting, normalizeFeatureFlags, setSetting, SETTING_KEYS } from '#modula/server/utils/settings'

function text(fr: string, en: string): CmsLocalizedText {
  return { fr, en }
}

function resolveTemplateAssetRoot() {
  const candidates = [
    path.resolve(process.cwd(), 'public', 'site-templates'),
    path.resolve(process.cwd(), '.output', 'public', 'site-templates')
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return candidates[0]
}

const templateAssetRoot = resolveTemplateAssetRoot()

type TemplateImageAsset = {
  source: string
  filename: string
  mimeType: string
  width: number
  height: number
}

const TEMPLATE_IMAGE_ASSETS: Record<CmsSiteTemplateKey, TemplateImageAsset[]> = {
  'modula-presentation': [
    { source: 'modula-hero.svg', filename: 'template-modula-hero.svg', mimeType: 'image/svg+xml', width: 1400, height: 1000 },
    { source: 'preview-modula.svg', filename: 'template-preview-modula.svg', mimeType: 'image/svg+xml', width: 1200, height: 760 },
    { source: 'preview-farm.svg', filename: 'template-preview-farm.svg', mimeType: 'image/svg+xml', width: 1200, height: 760 },
    { source: 'preview-association.svg', filename: 'template-preview-association.svg', mimeType: 'image/svg+xml', width: 1200, height: 760 },
    { source: 'modula-mark.svg', filename: 'template-modula-mark.svg', mimeType: 'image/svg+xml', width: 500, height: 500 }
  ],
  farm: [
    { source: 'farm-hero.svg', filename: 'template-farm-hero.svg', mimeType: 'image/svg+xml', width: 1400, height: 1000 },
    { source: 'preview-farm.svg', filename: 'template-preview-farm.svg', mimeType: 'image/svg+xml', width: 1200, height: 760 }
  ],
  association: [
    { source: 'association-hero.svg', filename: 'template-association-hero.svg', mimeType: 'image/svg+xml', width: 1400, height: 1000 },
    { source: 'preview-association.svg', filename: 'template-preview-association.svg', mimeType: 'image/svg+xml', width: 1200, height: 760 }
  ]
}

const TEMPLATE_UPLOAD_TO_BUNDLED_URL = Object.fromEntries(
  Object.values(TEMPLATE_IMAGE_ASSETS)
    .flat()
    .map((asset) => [getUploadUrl(asset.filename), `/site-templates/${asset.source}`])
) as Record<string, string>

function getUploadUrl(filename: string) {
  return `/uploads/${filename}`
}

async function ensureTemplateImageAsset(asset: TemplateImageAsset) {
  const existing = await prisma.image.findFirst({
    where: { filename: asset.filename }
  })

  if (existing) {
    return existing
  }

  const sourcePath = path.resolve(templateAssetRoot, asset.source)
  let buffer: Buffer | null = null
  try {
    buffer = await readFile(sourcePath)
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      throw error
    }
  }

  if (buffer) {
    await putUploadObject(asset.filename, new Uint8Array(buffer), asset.mimeType)
  }

  return await prisma.image.create({
    data: {
      filename: asset.filename,
      // Fallback: if the source file is not available on host FS,
      // keep a valid URL against the bundled public assets.
      url: buffer ? getUploadUrl(asset.filename) : `/site-templates/${asset.source}`,
      mimeType: asset.mimeType,
      size: buffer?.byteLength ?? 0,
      width: asset.width,
      height: asset.height,
      uploadedById: null
    }
  })
}

async function ensureTemplateAssets(templateKey: CmsSiteTemplateKey) {
  const assets = TEMPLATE_IMAGE_ASSETS[templateKey] || []
  for (const asset of assets) {
    await ensureTemplateImageAsset(asset)
  }
}

function getTemplateAssetUrl(templateKey: CmsSiteTemplateKey, sourceName: string) {
  const asset = (TEMPLATE_IMAGE_ASSETS[templateKey] || []).find(item => item.source === sourceName)
  return asset ? getUploadUrl(asset.filename) : `/site-templates/${sourceName}`
}

function createHeroButtons(primaryHref: string, primaryLabelFr: string, primaryLabelEn: string, secondaryHref: string, secondaryLabelFr: string, secondaryLabelEn: string) {
  const buttons = createButtonsItem('hero-buttons')
  buttons.primaryButton!.label = text(primaryLabelFr, primaryLabelEn)
  buttons.primaryButton!.href = primaryHref
  buttons.secondaryButton = {
    label: text(secondaryLabelFr, secondaryLabelEn),
    href: secondaryHref,
    tone: 'outline',
    size: 'md',
    backgroundColor: null,
    textColor: null,
    borderColor: null
  }
  return buttons
}

function createFeatureCard(id: string, titleFr: string, titleEn: string, bodyFr: string, bodyEn: string, icon: string): PageBuilderCard {
  return {
    id,
    title: text(titleFr, titleEn),
    text: text('', ''),
    icon,
    elements: [
      {
        ...createEmptyCardElement(`${id}-title`, 'title'),
        icon: '',
        title: text(titleFr, titleEn),
        text: text('', ''),
        titleSize: 'lg',
        textSize: 'sm'
      },
      {
        ...createEmptyCardElement(`${id}-body`, 'text'),
        icon: '',
        title: text('', ''),
        text: text(bodyFr, bodyEn),
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
}

function createShowcaseContent(options: {
  sectionId: string
  badge: CmsLocalizedText
  title: CmsLocalizedText
  body: CmsLocalizedText
  imageUrl: string
  imageAlt: CmsLocalizedText
  primaryHref: string
  primaryLabel: CmsLocalizedText
  secondaryHref: string
  secondaryLabel: CmsLocalizedText
  cards: Array<{ id: string; title: CmsLocalizedText; body: CmsLocalizedText; icon: string }>
}): PageBuilderContent {
  const hero = createEmptyColumnsSection(`${options.sectionId}-hero`, 2)
  hero.containerWidth = 'wide'
  hero.columns[0]!.items.push(
    Object.assign(createBadgeItem(`${options.sectionId}-badge`), { text: options.badge }),
    Object.assign(createTitleItem(`${options.sectionId}-title`), { headingTag: 'h1', size: '3xl', text: options.title }),
    Object.assign(createTextItem(`${options.sectionId}-text`), { size: 'lg', text: options.body }),
    createHeroButtons(
      options.primaryHref,
      options.primaryLabel.fr,
      options.primaryLabel.en,
      options.secondaryHref,
      options.secondaryLabel.fr,
      options.secondaryLabel.en
    )
  )
  hero.columns[1]!.items.push(
    Object.assign(createImageItem(`${options.sectionId}-image`), {
      imageUrl: options.imageUrl,
      alt: options.imageAlt,
      aspect: 'portrait',
      fit: 'contain',
      framed: false
    })
  )

  const features = createEmptyColumnsSection(`${options.sectionId}-features`, 1)
  features.containerWidth = 'wide'
  const cards = createCardsItem(`${options.sectionId}-cards`)
  cards.display = 'grid-3'
  cards.cards = options.cards.map((card) => createFeatureCard(card.id, card.title.fr, card.title.en, card.body.fr, card.body.en, card.icon))
  features.columns[0]!.items.push(cards)

  return {
    version: 1,
    sections: [hero, features]
  }
}

function createContactContent(options: {
  intro: CmsLocalizedText
  formTitle: CmsLocalizedText
  formIntro: CmsLocalizedText
  infoCardTitle: CmsLocalizedText
  socialTitle: CmsLocalizedText
}): PageBuilderContent {
  const section = createEmptyColumnsSection('contact-template', 2)
  section.containerWidth = 'wide'
  section.columns[0]!.items.push(
    Object.assign(createTitleItem('contact-heading'), { headingTag: 'h1', size: '2xl', text: text('Contact', 'Contact') }),
    Object.assign(createTextItem('contact-intro'), { text: options.intro })
  )

  const form = createFormItem('contact-form-template')
  form.formKey = 'contact'
  form.title = options.formTitle
  form.intro = options.formIntro
  form.submitLabel = text('Envoyer le message', 'Send message')
  form.successMessage = text('Votre message a été envoyé.', 'Your message has been sent.')
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
          label: text('Nom', 'Name'),
          placeholder: text('Votre nom', 'Your name'),
          helpText: text('', ''),
          required: true,
          defaultValue: '',
          defaultChecked: false,
          regexPattern: '',
          errorMessage: text('Veuillez renseigner votre nom.', 'Please provide your name.'),
          textareaMinLines: 4,
          options: []
        },
        {
          id: 'contact-email',
          name: 'email',
          type: 'email',
          width: 1,
          label: text('Email', 'Email'),
          placeholder: text('vous@exemple.fr', 'you@example.com'),
          helpText: text('', ''),
          required: true,
          defaultValue: '',
          defaultChecked: false,
          regexPattern: '',
          errorMessage: text('Veuillez saisir un email valide.', 'Please provide a valid email.'),
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
          label: text('Message', 'Message'),
          placeholder: text('Décrivez votre demande', 'Describe your request'),
          helpText: text('', ''),
          required: true,
          defaultValue: '',
          defaultChecked: false,
          regexPattern: '',
          errorMessage: text('Veuillez saisir un message.', 'Please enter a message.'),
          textareaMinLines: 6,
          options: []
        }
      ]
    }
  ]
  section.columns[0]!.items.push(form)

  const cards = createCardsItem('contact-side-cards')
  cards.display = 'stack'
  cards.cards = [
    {
      ...createFeatureCard('contact-details-card', options.infoCardTitle.fr, options.infoCardTitle.en, '', '', 'mdi:map-marker-outline'),
      elements: [
        {
          ...createEmptyCardElement('contact-details-title', 'title'),
          title: options.infoCardTitle,
          text: text('', ''),
          icon: ''
        },
        {
          ...createEmptyCardElement('contact-address', 'text'),
          source: 'address',
          icon: 'mdi:map-marker',
          title: text('Adresse', 'Address'),
          text: text('', '')
        },
        {
          ...createEmptyCardElement('contact-phone', 'text'),
          source: 'phone',
          icon: 'mdi:phone',
          title: text('Téléphone', 'Phone'),
          text: text('', '')
        },
        {
          ...createEmptyCardElement('contact-email-card', 'text'),
          source: 'email',
          icon: 'mdi:email',
          title: text('Email', 'Email'),
          text: text('', '')
        }
      ]
    },
    {
      ...createFeatureCard('contact-social-card', options.socialTitle.fr, options.socialTitle.en, '', '', 'mdi:share-variant-outline'),
      elements: [
        {
          ...createEmptyCardElement('contact-social-title', 'title'),
          title: options.socialTitle,
          text: text('', ''),
          icon: ''
        },
        {
          ...createEmptyCardElement('contact-social-list', 'text'),
          source: 'social-links',
          icon: '',
          title: text('', ''),
          text: text('', '')
        }
      ]
    }
  ]
  section.columns[1]!.items.push(cards)

  return { version: 1, sections: [section] }
}

function templateNavigation(key: CmsSiteTemplateKey): Array<CmsNavigationItemPayload & { id?: number | null }> {
  const defaults = createDefaultCmsNavigationItems().map(item => ({ id: null, ...item }))

  if (key === 'association') {
    return defaults
      .filter(item => item.href !== '/paniers')
      .map((item) => {
        if (item.href === '/news') {
          item.labels = text('Planning', 'Planning')
          item.title = 'Planning'
          item.href = '/planning'
          item.itemType = 'APPLICATION_ROUTE'
        }
        return item
      })
      .concat([
        {
          id: null,
          menu: 'PRIMARY',
          itemType: 'APPLICATION_ROUTE',
          title: 'Événements',
          labels: text('Événements', 'Events'),
          navigationItemKey: 'events-primary',
          parentItemKey: null,
          href: '/events',
          pageId: null,
          newTab: false,
          visible: true,
          position: 2
        }
      ])
  }

  if (key === 'modula-presentation') {
    return defaults
      .filter(item => !['/paniers', '/news'].includes(item.href))
      .map((item) => {
        if (item.href === '/contact') {
          item.position = 3
        }
        return item
      })
      .concat([
        {
          id: null,
          menu: 'PRIMARY',
          itemType: 'APPLICATION_ROUTE',
          title: 'Modules',
          labels: text('Modules', 'Modules'),
          navigationItemKey: 'modules-primary',
          parentItemKey: null,
          href: '/planning',
          pageId: null,
          newTab: false,
          visible: true,
          position: 1
        }
      ])
  }

  return defaults
}

function buildTemplateHomePage(key: CmsSiteTemplateKey, siteName: CmsLocalizedText): PageBuilderContent {
  const heroImage = (sourceName: string) => getTemplateAssetUrl(key, sourceName)

  switch (key) {
    case 'farm':
      return createShowcaseContent({
        sectionId: 'farm-home',
        badge: text('Ferme locale', 'Local farm'),
        title: text(`Bienvenue à ${siteName.fr}`, `Welcome to ${siteName.en}`),
        body: text(
          'Présentez vos paniers, votre vente directe, vos nouvelles et vos événements de saison sur un site simple à administrer.',
          'Showcase your baskets, direct sales, news and seasonal events on a website that stays easy to manage.'
        ),
        imageUrl: heroImage('farm-hero.svg'),
        imageAlt: text('Illustration ferme', 'Farm illustration'),
        primaryHref: '/paniers',
        primaryLabel: text('Voir les paniers', 'Browse baskets'),
        secondaryHref: '/contact',
        secondaryLabel: text('Nous contacter', 'Contact us'),
        cards: [
          { id: 'farm-card-1', title: text('Paniers', 'Baskets'), body: text('Exposez vos paniers et gérez les réservations.', 'Show your baskets and manage reservations.'), icon: 'mdi:basket-outline' },
          { id: 'farm-card-2', title: text('Actualités', 'News'), body: text('Publiez les récoltes, nouveautés et temps forts.', 'Publish harvest news, updates and highlights.'), icon: 'mdi:newspaper-variant-outline' },
          { id: 'farm-card-3', title: text('Événements', 'Events'), body: text('Annoncez portes ouvertes, ateliers et visites.', 'Announce open days, workshops and visits.'), icon: 'mdi:calendar-star' }
        ]
      })
    case 'association':
      return createShowcaseContent({
        sectionId: 'association-home',
        badge: text('Association vivante', 'Active community'),
        title: text(`Bienvenue sur ${siteName.fr}`, `Welcome to ${siteName.en}`),
        body: text(
          'Organisez vos événements, vos permanences et la mobilisation bénévole autour d\'un planning clair.',
          'Coordinate your events, volunteer shifts and community participation from a clear schedule.'
        ),
        imageUrl: heroImage('association-hero.svg'),
        imageAlt: text('Illustration association', 'Association illustration'),
        primaryHref: '/planning',
        primaryLabel: text('Voir le planning', 'View the planning'),
        secondaryHref: '/events',
        secondaryLabel: text('Voir les événements', 'View events'),
        cards: [
          { id: 'association-card-1', title: text('Permanences', 'Volunteer shifts'), body: text('Affichez les permanences à venir et les créneaux utiles.', 'Show upcoming shifts and useful participation slots.'), icon: 'mdi:calendar-clock-outline' },
          { id: 'association-card-2', title: text('Bénévolat', 'Volunteering'), body: text('Mettez en avant les besoins et facilitez l\'engagement.', 'Highlight needs and make volunteering easier.'), icon: 'mdi:hand-heart-outline' },
          { id: 'association-card-3', title: text('Événements', 'Events'), body: text('Séparez la communication publique et l\'organisation interne.', 'Separate public communication from internal coordination.'), icon: 'mdi:party-popper' }
        ]
      })
    default:
      {
        const base = createShowcaseContent({
          sectionId: 'modula-home',
          badge: text('Modula CMS', 'Modula CMS'),
          title: text('Le CMS modulable pour votre projet', 'The modular CMS for your project'),
          body: text(
            'Présentez vos contenus, gérez vos pages, vos événements et votre planning depuis une seule interface.',
            'Publish content, manage pages, events and planning from a single interface.'
          ),
          imageUrl: heroImage('modula-hero.svg'),
          imageAlt: text('Illustration Modula CMS', 'Modula CMS illustration'),
          primaryHref: '/events',
          primaryLabel: text('Voir les événements', 'View events'),
          secondaryHref: '/contact',
          secondaryLabel: text('Demander une démo', 'Request a demo'),
          cards: [
            { id: 'modula-card-1', title: text('CMS visuel', 'Visual CMS'), body: text('Éditez les pages directement avec le live edit.', 'Edit pages directly with live edit.'), icon: 'mdi:pencil-ruler-outline' },
            { id: 'modula-card-2', title: text('Planning', 'Planning'), body: text('Affichez vos événements et permanences selon vos besoins.', 'Display events and volunteer shifts based on your needs.'), icon: 'mdi:view-week-outline' },
            { id: 'modula-card-3', title: text('Personnalisation', 'Customization'), body: text('Adaptez navigation, footer, thèmes et contenus sans code.', 'Adjust navigation, footer, themes and content without code.'), icon: 'mdi:tune-variant' }
          ]
        })

        const templatesSection = createEmptyColumnsSection('modula-templates-overview', 3)
        templatesSection.containerWidth = 'wide'
        templatesSection.beforeItems = [
          Object.assign(createBadgeItem('modula-templates-badge'), { text: text('Templates prêts à l\'emploi', 'Ready-to-use templates') }),
          Object.assign(createTitleItem('modula-templates-title'), { headingTag: 'h2', size: '2xl', text: text('Choisissez un point de départ visuel', 'Pick a visual starting point') }),
          Object.assign(createTextItem('modula-templates-text'), {
            text: text(
              'Chaque template configure automatiquement le contenu CMS, la navigation, les thèmes et les images.',
              'Each template automatically configures CMS content, navigation, themes and images.'
            )
          })
        ]
        const galleryItems = [
          {
            id: 'template-modula',
            imageUrl: heroImage('preview-modula.svg'),
            title: text('Présentation Modula', 'Modula showcase'),
            body: text('Idéal pour présenter toutes les capacités du CMS.', 'Ideal for presenting all CMS capabilities.')
          },
          {
            id: 'template-farm',
            imageUrl: heroImage('preview-farm.svg'),
            title: text('Template ferme', 'Farm template'),
            body: text('Pensé pour la vente directe, les paniers et l\'actualité terrain.', 'Designed for direct sales, baskets and field updates.')
          },
          {
            id: 'template-association',
            imageUrl: heroImage('preview-association.svg'),
            title: text('Template association', 'Association template'),
            body: text('Orienté planning, événements publics et bénévolat.', 'Focused on planning, public events and volunteering.')
          }
        ]
        for (const [index, item] of galleryItems.entries()) {
          const column = templatesSection.columns[index]
          if (!column) continue
          column.items.push(
            Object.assign(createImageItem(`${item.id}-image`), {
              imageUrl: item.imageUrl,
              alt: item.title,
              aspect: 'landscape',
              fit: 'cover',
              framed: true,
              enlarge: false
            }),
            Object.assign(createTitleItem(`${item.id}-title`), { headingTag: 'h3', size: 'lg', text: item.title }),
            Object.assign(createTextItem(`${item.id}-text`), { text: item.body })
          )
        }

        const themesSection = createEmptyColumnsSection('modula-themes-overview', 1)
        themesSection.containerWidth = 'wide'
        themesSection.beforeItems = [
          Object.assign(createBadgeItem('modula-themes-badge'), { text: text('Thèmes intégrés', 'Built-in themes') }),
          Object.assign(createTitleItem('modula-themes-title'), { headingTag: 'h2', size: '2xl', text: text('Système de thème dynamique', 'Dynamic theme system') }),
          Object.assign(createTextItem('modula-themes-text'), {
            text: text(
              'Changez de charte graphique en un clic : palette, contraste, typographie visuelle et ambiance globale.',
              'Switch visual identity in one click: palette, contrast, visual typography and overall atmosphere.'
            )
          })
        ]
        const themeCards = createCardsItem('modula-theme-cards')
        themeCards.display = 'grid-4'
        themeCards.cards = [
          createFeatureCard('theme-card-1', 'Studio', 'Studio', 'Palette éditoriale claire, idéale pour une vitrine premium.', 'Editorial light palette, ideal for a premium showcase.', 'mdi:monitor-dashboard'),
          createFeatureCard('theme-card-2', 'Ocean', 'Ocean', 'Ambiance moderne orientée produit et contenu structuré.', 'Modern atmosphere for product and structured content.', 'mdi:waves'),
          createFeatureCard('theme-card-3', 'Noir', 'Noir', 'Version sombre soignée, parfaite pour les usages nocturnes.', 'Polished dark version for night usage.', 'mdi:weather-night'),
          createFeatureCard('theme-card-4', 'Sunset', 'Sunset', 'Palette chaude pour communication associative ou événementielle.', 'Warm palette for community or event communication.', 'mdi:weather-sunset')
        ]
        themesSection.columns[0]?.items.push(themeCards)

        return {
          version: 1,
          sections: [...base.sections, templatesSection, themesSection]
        }
      }
  }
}

function buildTemplateContactPage(key: CmsSiteTemplateKey): PageBuilderContent {
  if (key === 'association') {
    return createContactContent({
      intro: text(
        'Une question sur les événements, les permanences ou le bénévolat ? Utilisez ce formulaire pour nous écrire.',
        'A question about events, volunteer shifts or community participation? Use this form to contact us.'
      ),
      formTitle: text('Parlons de votre projet', 'Let\'s talk about your project'),
      formIntro: text('Décrivez votre demande, votre question ou votre envie de participer.', 'Describe your request, question or wish to contribute.'),
      infoCardTitle: text('Nos informations', 'Our information'),
      socialTitle: text('Suivez-nous', 'Follow us')
    })
  }

  if (key === 'modula-presentation') {
    return createContactContent({
      intro: text(
        'Besoin d\'un site éditorial, d\'un planning public ou d\'un back-office plus simple à gérer ? Écrivez-nous.',
        'Need an editorial site, a public planning page or a simpler back-office? Get in touch.'
      ),
      formTitle: text('Demander une démo', 'Request a demo'),
      formIntro: text('Laissez quelques mots sur votre besoin et nous reviendrons vers vous.', 'Leave a few words about your needs and we will get back to you.'),
      infoCardTitle: text('Coordonnées', 'Contact details'),
      socialTitle: text('Présence en ligne', 'Online presence')
    })
  }

  return createContactContent({
    intro: text(
      'Une question sur les paniers, la vente directe ou les horaires ? Utilisez le formulaire ci-dessous pour nous écrire.',
      'A question about baskets, direct sales or opening hours? Use the form below to contact us.'
    ),
    formTitle: text('Nous écrire', 'Send us a message'),
    formIntro: text('Les champs marqués d\'un astérisque sont obligatoires.', 'Fields marked with an asterisk are required.'),
    infoCardTitle: text('Nos coordonnées', 'Contact details'),
    socialTitle: text('Suivez-nous', 'Follow us')
  })
}

function buildTemplateSettings(key: CmsSiteTemplateKey, current: CmsSiteSettings): CmsSiteSettingsTemplatePayload {
  const base = createDefaultCmsSiteSettings()
  const siteName = current.siteName
  const siteTagline = current.siteTagline

  if (key === 'farm') {
    return {
      ...base,
      siteName,
      siteTagline,
      header: {
        ...base.header,
        showSiteTagline: true
      },
      footer: {
        ...base.footer,
        backgroundColor: createThemeColorSelection('secondary'),
        textColor: createThemeColorSelection('secondary-content'),
        copyright: text(`${siteName.fr}. Production locale et vente directe.`, `${siteName.en}. Local production and direct sales.`)
      },
      socialLinks: current.socialLinks,
      basketsPage: {
        ...base.basketsPage,
        subtitle: text(
          'Retrouvez les paniers de saison, le retrait à la ferme et les informations pratiques.',
          'Browse seasonal baskets, farm pickup and practical information.'
        )
      },
      newsPage: {
        ...base.newsPage,
        subtitle: text(
          'Récoltes, nouveautés et vie de la ferme.',
          'Harvests, updates and life at the farm.'
        )
      },
      eventsPage: {
        ...base.eventsPage,
        title: text('Événements à la ferme', 'Farm events'),
        subtitle: text(
          'Retrouvez les portes ouvertes, ateliers et rendez-vous publics.',
          'Discover open days, workshops and public events.'
        )
      },
      planningPage: {
        ...base.planningPage,
        title: text('Planning de la ferme', 'Farm planning'),
        subtitle: text(
          'Consultez les rendez-vous publics et, si vous êtes connecté, les permanences bénévoles.',
          'Check public activities and, if you are logged in, volunteer shifts.'
        )
      }
    }
  }

  if (key === 'association') {
    return {
      ...base,
      siteName,
      siteTagline,
      footer: {
        ...base.footer,
        backgroundColor: createThemeColorSelection('accent'),
        textColor: createThemeColorSelection('accent-content'),
        copyright: text(`${siteName.fr}. Vie associative et engagement collectif.`, `${siteName.en}. Community life and collective engagement.`)
      },
      socialLinks: current.socialLinks,
      basketsPage: current.basketsPage,
      newsPage: {
        ...base.newsPage,
        title: text('Actualités de l\'association', 'Association news'),
        subtitle: text(
          'Suivez les annonces, comptes-rendus et informations importantes.',
          'Follow announcements, reports and important updates.'
        )
      },
      eventsPage: {
        ...base.eventsPage,
        title: text('Événements publics', 'Public events'),
        subtitle: text(
          'Les événements ouverts à toutes et tous.',
          'Public events open to everyone.'
        )
      },
      planningPage: {
        ...base.planningPage,
        title: text('Planning bénévolat', 'Volunteer planning'),
        subtitle: text(
          'Visualisez les permanences, les besoins et les événements de la structure.',
          'View shifts, staffing needs and organization events.'
        )
      }
    }
  }

  return {
    ...base,
    siteName,
    siteTagline,
    socialLinks: current.socialLinks,
    footer: {
      ...base.footer,
      backgroundColor: createThemeColorSelection('neutral'),
      textColor: createThemeColorSelection('neutral-content'),
      copyright: text(`${siteName.fr}. Propulsé par Modula CMS.`, `${siteName.en}. Powered by Modula CMS.`)
    },
    eventsPage: {
      ...base.eventsPage,
      title: text('Événements', 'Events'),
      subtitle: text(
        'Présentez vos prochains rendez-vous et les temps forts de votre activité.',
        'Showcase your upcoming events and key moments.'
      )
    },
    planningPage: {
      ...base.planningPage,
      title: text('Planning', 'Planning'),
      subtitle: text(
        'Affichez vos événements et votre organisation dans une vue claire.',
        'Display your events and organization in a clear overview.'
      )
    }
  }
}

async function savePageByPath(path: string, payload: CmsPagePayload) {
  const existing = await getCmsPageByPath(path)
  await saveCmsPage(existing?.id ?? null, payload)
}

function createPagePayload(path: string, slug: string, titleFr: string, titleEn: string, content: PageBuilderContent): CmsPagePayload {
  return {
    ...createDefaultCmsPagePayload(path, titleFr),
    path,
    slug,
    pageType: path === '/events' || path === '/planning' ? 'APPLICATION' : 'CMS',
    status: 'PUBLISHED',
    rendererKey: path === '/events' ? 'events' : path === '/planning' ? 'planning' : '',
    title: titleFr,
    templateKey: 'default',
    translations: {
      fr: {
        title: titleFr,
        navigationLabel: titleFr,
        seo: createEmptyCmsPageSeo(),
        content
      },
      en: {
        title: titleEn,
        navigationLabel: titleEn,
        seo: createEmptyCmsPageSeo(),
        content
      }
    }
  }
}

export async function listSiteTemplates(): Promise<CmsSiteTemplateDefinition[]> {
  return await listMergedSiteTemplates()
}

export async function getCurrentSiteTemplateKey(): Promise<CmsSiteTemplateKey | null> {
  const raw = await getSetting(SETTING_KEYS.CMS_SITE_TEMPLATE_KEY)
  return raw?.trim() || null
}

function buildTemplateThemeConfig(templateKey: CmsSiteTemplateKey): DaisyUiThemeConfig {
  if (templateKey === 'farm') {
    return {
      enableThemeController: true,
      themes: [
        {
          id: 'farm-harvest',
          name: 'farm-harvest',
          displayName: 'Harvest',
          enabled: true,
          includeInThemeSelector: true,
          isDefault: true,
          isDefaultDark: false,
          colorScheme: 'light',
          colors: {
            base100: '#fbf5ea', base200: '#f2e3c8', base300: '#e6cf9f', baseContent: '#3b2a18',
            primary: '#b45225', primaryContent: '#fff4ec', secondary: '#7f9c3a', secondaryContent: '#1a240d',
            accent: '#dd9a2d', accentContent: '#3b2a18', neutral: '#5f4630', neutralContent: '#f7ecdb',
            info: '#3d84c6', infoContent: '#ecf5ff', success: '#568a38', successContent: '#f0f8ea',
            warning: '#c68424', warningContent: '#2f1f08', error: '#b53a2a', errorContent: '#ffecea'
          },
          tokens: { radiusSelector: '0.45rem', radiusField: '0.45rem', radiusBox: '1rem', sizeSelector: '0.25rem', sizeField: '0.25rem', border: '1px', depth: '1', noise: '0' }
        }
      ]
    }
  }

  if (templateKey === 'association') {
    return {
      enableThemeController: true,
      themes: [
        {
          id: 'collective-day',
          name: 'collective-day',
          displayName: 'Collective Day',
          enabled: true,
          includeInThemeSelector: true,
          isDefault: true,
          isDefaultDark: false,
          colorScheme: 'light',
          colors: {
            base100: '#f6f8ff', base200: '#e8edff', base300: '#d5dcf6', baseContent: '#1f2a4a',
            primary: '#3f5ccf', primaryContent: '#eef2ff', secondary: '#2f9a88', secondaryContent: '#e9fffb',
            accent: '#f39f3f', accentContent: '#3a2206', neutral: '#344364', neutralContent: '#edf2ff',
            info: '#3b82f6', infoContent: '#eef6ff', success: '#2f9e66', successContent: '#ecfff5',
            warning: '#d2852f', warningContent: '#2f1a06', error: '#c7423a', errorContent: '#ffefee'
          },
          tokens: { radiusSelector: '0.45rem', radiusField: '0.45rem', radiusBox: '1rem', sizeSelector: '0.25rem', sizeField: '0.25rem', border: '1px', depth: '1', noise: '0' }
        }
      ]
    }
  }

  return {
    enableThemeController: true,
    themes: [
      {
        id: 'modula-studio',
        name: 'modula-studio',
        displayName: 'Modula Studio',
        enabled: true,
        includeInThemeSelector: true,
        isDefault: true,
        isDefaultDark: false,
        colorScheme: 'light',
        colors: {
          base100: '#f7f7fc', base200: '#ebeaf6', base300: '#ddd9ed', baseContent: '#1e2236',
          primary: '#4b56d2', primaryContent: '#f3f5ff', secondary: '#0f8b8d', secondaryContent: '#e7ffff',
          accent: '#ff8c4b', accentContent: '#2f1504', neutral: '#394062', neutralContent: '#e8ecff',
          info: '#3b82f6', infoContent: '#edf5ff', success: '#2f9e66', successContent: '#edfff5',
          warning: '#d48a2f', warningContent: '#311b06', error: '#cc3f4b', errorContent: '#ffedf1'
        },
        tokens: { radiusSelector: '0.5rem', radiusField: '0.5rem', radiusBox: '1.1rem', sizeSelector: '0.25rem', sizeField: '0.25rem', border: '1px', depth: '1', noise: '0' }
      },
      {
        id: 'modula-ocean',
        name: 'modula-ocean',
        displayName: 'Modula Ocean',
        enabled: true,
        includeInThemeSelector: true,
        isDefault: false,
        isDefaultDark: false,
        colorScheme: 'light',
        colors: {
          base100: '#eef7fb', base200: '#dff0f8', base300: '#c6e3f0', baseContent: '#153447',
          primary: '#1f7ca0', primaryContent: '#e8f8ff', secondary: '#2f67c9', secondaryContent: '#ecf2ff',
          accent: '#ec8d3c', accentContent: '#2f1705', neutral: '#27506a', neutralContent: '#e7f6ff',
          info: '#2f7fd3', infoContent: '#edf6ff', success: '#2f9e75', successContent: '#edfff8',
          warning: '#d09b2f', warningContent: '#312106', error: '#c34b4b', errorContent: '#ffefef'
        },
        tokens: { radiusSelector: '0.5rem', radiusField: '0.5rem', radiusBox: '1.1rem', sizeSelector: '0.25rem', sizeField: '0.25rem', border: '1px', depth: '1', noise: '0' }
      },
      {
        id: 'modula-noir',
        name: 'modula-noir',
        displayName: 'Modula Noir',
        enabled: true,
        includeInThemeSelector: true,
        isDefault: false,
        isDefaultDark: true,
        colorScheme: 'dark',
        colors: {
          base100: '#151823', base200: '#1d2330', base300: '#283043', baseContent: '#e9ecff',
          primary: '#6d7dff', primaryContent: '#0f1224', secondary: '#3ec3c5', secondaryContent: '#082020',
          accent: '#ff9f63', accentContent: '#281306', neutral: '#394463', neutralContent: '#e4eaff',
          info: '#62a9ff', infoContent: '#081325', success: '#62c18d', successContent: '#081e13',
          warning: '#f1b35b', warningContent: '#2b1807', error: '#f57b84', errorContent: '#28070d'
        },
        tokens: { radiusSelector: '0.5rem', radiusField: '0.5rem', radiusBox: '1.1rem', sizeSelector: '0.25rem', sizeField: '0.25rem', border: '1px', depth: '1', noise: '0' }
      },
      {
        id: 'modula-sunset',
        name: 'modula-sunset',
        displayName: 'Modula Sunset',
        enabled: true,
        includeInThemeSelector: true,
        isDefault: false,
        isDefaultDark: false,
        colorScheme: 'light',
        colors: {
          base100: '#fff6f1', base200: '#ffe8dc', base300: '#ffd6c2', baseContent: '#43231b',
          primary: '#cf5b3d', primaryContent: '#fff0ea', secondary: '#7f4fc3', secondaryContent: '#f4efff',
          accent: '#e29f38', accentContent: '#3a2507', neutral: '#614032', neutralContent: '#ffefe7',
          info: '#3f86c8', infoContent: '#eff7ff', success: '#4f9a64', successContent: '#f1fff5',
          warning: '#d0892f', warningContent: '#2f1c06', error: '#c34842', errorContent: '#ffefee'
        },
        tokens: { radiusSelector: '0.5rem', radiusField: '0.5rem', radiusBox: '1.1rem', sizeSelector: '0.25rem', sizeField: '0.25rem', border: '1px', depth: '1', noise: '0' }
      }
    ]
  }
}

function buildTemplateFeatureFlags(templateKey: CmsSiteTemplateKey) {
  return normalizeFeatureFlags(templateKey === 'farm'
    ? {
      inDevelopment: false,
      registerEnabled: false,
      subscriptionsEnabled: false,
      shop: { enabled: true, basketsEnabled: true, vegetablesEnabled: true },
      associationRolesEnabled: false,
      eventsEnabled: true,
      newsEnabled: true
    }
    : templateKey === 'association'
      ? {
        inDevelopment: false,
        registerEnabled: false,
        subscriptionsEnabled: false,
        shop: { enabled: false, basketsEnabled: false, vegetablesEnabled: false },
        associationRolesEnabled: true,
        eventsEnabled: true,
        newsEnabled: true
      }
      : {
        inDevelopment: false,
        registerEnabled: false,
        subscriptionsEnabled: false,
        shop: { enabled: false, basketsEnabled: false, vegetablesEnabled: false },
        associationRolesEnabled: false,
        eventsEnabled: false,
        newsEnabled: false
      })
}

function replaceTemplateUploadUrlsWithBundledUrls<T>(value: T): T {
  if (typeof value === 'string') {
    return (TEMPLATE_UPLOAD_TO_BUNDLED_URL[value] || value) as T
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceTemplateUploadUrlsWithBundledUrls(item)) as T
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceTemplateUploadUrlsWithBundledUrls(item)])
    ) as T
  }
  return value
}

export async function buildBundledSystemTemplateSnapshot(templateKey: BundledSystemSiteTemplateKey): Promise<CmsRegistryTemplateSnapshot> {
  const baseSettings = createDefaultCmsSiteSettings()
  baseSettings.siteName = {
    fr: cmsProjectConfig.seed.defaultSiteName.fr,
    en: cmsProjectConfig.seed.defaultSiteName.en
  }
  baseSettings.siteTagline = {
    fr: cmsProjectConfig.seed.defaultSiteTagline.fr,
    en: cmsProjectConfig.seed.defaultSiteTagline.en
  }

  const nextSettings = buildTemplateSettings(templateKey, baseSettings)
  const siteNameFr = nextSettings.siteName.fr || cmsProjectConfig.seed.defaultSiteName.fr
  const siteNameEn = nextSettings.siteName.en || cmsProjectConfig.seed.defaultSiteName.en
  const partialSnapshot = replaceTemplateUploadUrlsWithBundledUrls({
    siteSettings: {
      ...baseSettings,
      ...nextSettings,
      cookieBanner: baseSettings.cookieBanner as CmsCookieBannerSettings
    },
    navigation: templateNavigation(templateKey),
    pages: [
      createPagePayload('/', 'home', 'Accueil', 'Home', buildTemplateHomePage(templateKey, text(siteNameFr, siteNameEn))),
      createPagePayload('/contact', 'contact', 'Contact', 'Contact', buildTemplateContactPage(templateKey))
    ],
    themeConfig: buildTemplateThemeConfig(templateKey),
    featureFlags: buildTemplateFeatureFlags(templateKey)
  })

  const assetManifest = await exportTemplateAssets(partialSnapshot)
  return {
    ...partialSnapshot,
    assetManifest
  }
}

export async function applyBundledSiteTemplate(templateKey: BundledSystemSiteTemplateKey) {
  await ensureCmsRootPage()
  await ensureCmsSystemPages()
  await ensureTemplateAssets(templateKey)

  const currentSettings = await getCmsSiteSettings()
  const nextSettings = buildTemplateSettings(templateKey, currentSettings)
  await saveCmsSiteSettings({
    ...currentSettings,
    ...nextSettings,
    cookieBanner: currentSettings.cookieBanner as CmsCookieBannerSettings
  })

  const siteName = currentSettings.siteName.fr || cmsProjectConfig.seed.defaultSiteName.fr
  const siteNameEn = currentSettings.siteName.en || cmsProjectConfig.seed.defaultSiteName.en
  await savePageByPath('/', createPagePayload('/', 'home', 'Accueil', 'Home', buildTemplateHomePage(templateKey, text(siteName, siteNameEn))))
  await savePageByPath('/contact', createPagePayload('/contact', 'contact', 'Contact', 'Contact', buildTemplateContactPage(templateKey)))
  await saveCmsNavigationItems(templateNavigation(templateKey))
  await saveDaisyUiThemeConfig(buildTemplateThemeConfig(templateKey))

  const templateFeatureFlags = buildTemplateFeatureFlags(templateKey)

  await Promise.all([
    setSetting(SETTING_KEYS.CMS_SITE_TEMPLATE_KEY, templateKey),
    setSetting(SETTING_KEYS.SHOP_ENABLED, templateFeatureFlags.shop.enabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.SHOP_BASKETS_ENABLED, templateFeatureFlags.shop.basketsEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.SHOP_VEGETABLES_ENABLED, templateFeatureFlags.shop.vegetablesEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.ASSOCIATION_ROLES_ENABLED, templateFeatureFlags.associationRolesEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.EVENTS_ENABLED, templateFeatureFlags.eventsEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.NEWS_ENABLED, templateFeatureFlags.newsEnabled ? 'true' : 'false'),
    setSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED, 'true')
  ])
}

export async function applySiteTemplate(templateKey: CmsSiteTemplateKey) {
  if (templateKey !== FALLBACK_SITE_TEMPLATE_KEY) {
    await applyRegistryTemplate(templateKey)
    await setSetting(SETTING_KEYS.CMS_SITE_TEMPLATE_KEY, templateKey)
    return
  }
  await applyBundledSiteTemplate(templateKey)
}
