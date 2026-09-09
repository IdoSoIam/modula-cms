#!/usr/bin/env node
import Database from 'better-sqlite3'
import { mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

const databasePath = resolve(process.cwd(), process.env.CMS_SQLITE_PATH || '.data/sqlite/local.db')
const uploadsDir = resolve(process.cwd(), process.env.CMS_FILESYSTEM_STORAGE_DIR || 'public/uploads')
const db = new Database(databasePath)
const now = new Date().toISOString()
const sourceRoot = 'https://artimon-nautique-location.com/'

const accessories = [
  accessory('ski-nautique', 'Ski nautique', 'Water skis', 20, 30, 'images/icones/noun_project_578_waterskiing.svg', true, 'Skis adaptés à la pratique du ski nautique derrière un bateau compatible.'),
  accessory('bouee-tractee', 'Bouée tractée', 'Towable tube', 20, 30, 'images/icones/francois_bouee.svg', true, 'Bouée tractée fournie avec un gilet et une ligne de traction.'),
  accessory('enceinte-jbl-go-4', 'Enceinte JBL Go 4', 'JBL Go 4 speaker', 15, 20, 'images/icones/JBL.svg', true, 'Enceinte portable pour accompagner votre sortie en mer.'),
  accessory('wakeboard', 'Wakeboard', 'Wakeboard', null, null, 'images/icones/francois_wake.svg', false, 'Produit référencé mais temporairement indisponible.'),
  accessory('kneeboard', 'Kneeboard', 'Kneeboard', null, null, 'images/icones/francois_knee.svg', false, 'Produit référencé mais temporairement indisponible.'),
]

await mkdir(uploadsDir, { recursive: true })

try {
  const boatCategoryId = findCategoryId('boat', 'Bateaux')
  const accessoryCategoryId = ensureCategory('accessory', 'Accessoires', 'Skis, bouées et équipements complémentaires pour votre sortie.', 2)
  const downloadedImages = []

  for (const [index, product] of accessories.entries()) {
    const extension = product.sourcePath.endsWith('.svg') ? 'svg' : 'jpg'
    const filename = `artimon-${product.slug}.${extension}`
    const imageUrl = `/uploads/${filename}`
    const image = await downloadImage(new URL(product.sourcePath, sourceRoot), filename)
    const imageId = upsertImage(filename, imageUrl, image)
    const productId = upsertAccessory(product, accessoryCategoryId, index + 1, imageUrl)
    upsertImageUsage(imageId, 'product', String(productId), 'imageUrl', product.name)
    downloadedImages.push({ productId, imageId, imageUrl })
  }

  const accessoryPageId = upsertPage({
    path: '/accessoires',
    slug: 'accessoires',
    title: 'Accessoires',
    pageType: 'APPLICATION',
    rendererKey: 'shop',
    applicationConfig: {
      shopCategoryIds: [accessoryCategoryId],
      shopSubtitle: localized('Complétez votre sortie avec du matériel nautique et des équipements pratiques.', 'Complete your trip with water sports gear and practical equipment.'),
      shopDefaultViewMode: 'grid',
      shopShowViewToggle: true,
      shopPageSize: 12,
      shopCategoryLinks: [],
    },
    translations: pageTranslations(
      'Accessoires',
      'Accessories',
      'Location d’accessoires nautiques à Saint-Cyprien',
      'Water sports equipment rental in Saint-Cyprien',
      'Skis nautiques, bouées tractées et accessoires pour compléter votre location de bateau.',
      'Water skis, towable tubes and equipment to complete your boat rental.',
      emptyContent(),
    ),
  })

  const questionsContent = buildQuestionsContent()
  const questionsPageId = upsertPage({
    path: '/questions',
    slug: 'questions',
    title: 'Questions',
    pageType: 'CMS',
    rendererKey: null,
    applicationConfig: {},
    translations: pageTranslations(
      'Questions',
      'Questions',
      'Questions fréquentes sur la location de bateaux',
      'Frequently asked questions about boat rental',
      'Préparez votre location de bateau à Saint-Cyprien : réservation, paiement, sécurité et navigation.',
      'Prepare your boat rental in Saint-Cyprien: booking, payment, safety and navigation.',
      questionsContent,
    ),
  })

  const homeContent = buildHomeContent(boatCategoryId)
  const homePageId = upsertPage({
    path: '/',
    slug: 'home',
    title: 'Accueil',
    pageType: 'CMS',
    rendererKey: null,
    applicationConfig: {},
    translations: pageTranslations(
      'Accueil',
      'Home',
      'Artimon, location de bateaux à Saint-Cyprien',
      'Artimon boat rental in Saint-Cyprien',
      'Louez un bateau avec ou sans permis à Saint-Cyprien et découvrez la côte méditerranéenne avec un accompagnement personnalisé.',
      'Rent a boat with or without a licence in Saint-Cyprien and explore the Mediterranean coast with personal assistance.',
      homeContent,
    ),
  })

  const locationsPage = db.prepare('SELECT id, applicationConfigJson FROM CmsPage WHERE path = ?').get('/locations')
  if (locationsPage) {
    const config = safeJson(locationsPage.applicationConfigJson, {})
    const links = Array.isArray(config.shopCategoryLinks) ? config.shopCategoryLinks : []
    config.shopCategoryLinks = [
      ...links.filter(link => Number(link?.categoryId) !== accessoryCategoryId),
      { categoryId: accessoryCategoryId, pageId: accessoryPageId },
    ]
    db.prepare('UPDATE CmsPage SET applicationConfigJson = ?, updatedAt = ? WHERE id = ?')
      .run(JSON.stringify(config), now, locationsPage.id)
  }

  upsertNavigation('/accessoires', accessoryPageId, 'Accessoires', 'Accessories', 'nav-accessories', 'nav-shop', 'PRIMARY', 0)
  upsertNavigation('/questions', questionsPageId, 'Questions', 'Questions', 'nav-questions', null, 'PRIMARY', 3)
  syncCmsPageImageUsages(homePageId, [
    ['column-image:artimon-home-hero:2:artimon-home-hero-image', '/uploads/artimon-jeanneau-cap-camarat-75-cc.jpg', 'Artimon à Saint-Cyprien'],
    ['column-image:artimon-home-story:1:artimon-home-story-image', '/uploads/artimon-selva-d650-family-special.jpg', 'Sortie en bateau sur la Méditerranée'],
  ])

  console.log(JSON.stringify({
    databasePath,
    categories: { boatCategoryId, accessoryCategoryId },
    pages: { homePageId, accessoryPageId, questionsPageId },
    accessories: downloadedImages,
  }, null, 2))
} finally {
  db.close()
}

function accessory(slug, name, englishName, fourHourPrice, eightHourPrice, sourcePath, available, description) {
  return { slug, name, englishName, fourHourPrice, eightHourPrice, sourcePath, available, description }
}

function localized(fr, en = fr) {
  return { fr, en }
}

function safeJson(value, fallback) {
  try {
    return JSON.parse(String(value || ''))
  } catch {
    return fallback
  }
}

function findCategoryId(slug, name) {
  const row = db.prepare('SELECT id FROM ProductCategory WHERE slug = ? OR lower(name) = lower(?) ORDER BY id LIMIT 1').get(slug, name)
  if (!row) throw new Error(`Catégorie introuvable : ${name}`)
  return Number(row.id)
}

function ensureCategory(slug, name, description, position) {
  const row = db.prepare('SELECT id FROM ProductCategory WHERE slug = ? OR lower(name) = lower(?) ORDER BY id LIMIT 1').get(slug, name)
  if (row) {
    db.prepare('UPDATE ProductCategory SET name = ?, slug = ?, description = ?, position = ?, active = 1, updatedAt = ? WHERE id = ?')
      .run(name, slug, description, position, now, row.id)
    return Number(row.id)
  }
  return Number(db.prepare('INSERT INTO ProductCategory (name, slug, description, position, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, 1, ?, ?)')
    .run(name, slug, description, position, now, now).lastInsertRowid)
}

async function downloadImage(url, filename) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Téléchargement impossible (${response.status}) : ${url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(join(uploadsDir, filename), buffer)
  return { buffer, mimeType: response.headers.get('content-type')?.split(';')[0] || (filename.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg') }
}

function upsertImage(filename, url, image) {
  const row = db.prepare('SELECT id FROM Image WHERE url = ? ORDER BY id LIMIT 1').get(url)
  if (row) {
    db.prepare('UPDATE Image SET filename = ?, mimeType = ?, size = ? WHERE id = ?').run(filename, image.mimeType, image.buffer.length, row.id)
    return Number(row.id)
  }
  return Number(db.prepare('INSERT INTO Image (filename, url, mimeType, size, width, height, uploadedById, createdAt) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?)')
    .run(filename, url, image.mimeType, image.buffer.length, now).lastInsertRowid)
}

function upsertAccessory(product, categoryId, position, imageUrl) {
  const rates = product.available
    ? [{ pricingMode: 'HOURLY', duration: 240, price: product.fourHourPrice }, { pricingMode: 'HOURLY', duration: 480, price: product.eightHourPrice }]
    : []
  const details = [
    {
      id: 'accessory-rates',
      title: 'Tarifs',
      titleLocalized: localized('Tarifs', 'Rates'),
      items: product.available ? [
        detailField('four-hours', 'Forfait 4 heures', `${product.fourHourPrice} €`, '4-hour rate', `€${product.fourHourPrice}`),
        detailField('eight-hours', 'Forfait 8 heures', `${product.eightHourPrice} €`, '8-hour rate', `€${product.eightHourPrice}`),
      ] : [detailField('availability', 'Disponibilité', 'Non disponible actuellement', 'Availability', 'Currently unavailable')],
    },
    {
      id: 'accessory-included',
      title: 'Informations pratiques',
      titleLocalized: localized('Informations pratiques', 'Practical information'),
      items: [
        detailField('included', 'Matériel fourni', product.slug === 'enceinte-jbl-go-4' ? 'Enceinte portable' : 'Gilet et ligne de traction', 'Included equipment', product.slug === 'enceinte-jbl-go-4' ? 'Portable speaker' : 'Life jacket and tow line'),
        detailField('source', 'Source tarifaire', 'https://artimon-nautique-location.com/bateaux.php', 'Rate source', 'https://artimon-nautique-location.com/bateaux.php'),
      ],
    },
  ]
  const basePrice = Number(product.fourHourPrice || 0)
  const data = {
    name: product.name,
    nameJson: JSON.stringify(localized(product.name, product.englishName)),
    slug: product.slug,
    saleType: 'RENTAL',
    categoryId,
    excerpt: product.description,
    excerptJson: JSON.stringify(localized(product.description, product.available ? 'Optional equipment available for 4 or 8 hours.' : 'Listed equipment, currently unavailable.')),
    description: product.description,
    descriptionJson: JSON.stringify(localized(product.description, product.available ? 'Add this equipment to a 4-hour or 8-hour trip.' : 'This equipment is listed but currently unavailable.')),
    detailsJson: JSON.stringify(details),
    optionGroupsJson: '[]',
    excludedOptionSetIdsJson: '[]',
    optionOverridesJson: '[]',
    imageUrl,
    price: basePrice,
    vatRate: 20,
    paymentTaxCode: null,
    paymentTaxBehavior: null,
    stock: product.available ? 1 : 0,
    rentalAvailableFrom: null,
    rentalAvailableTo: null,
    rentalMinDays: 1,
    rentalMaxDays: null,
    rentalBookingMode: 'SINGLE_DAY',
    rentalApprovalMode: 'MANUAL',
    rentalHourlyPrice: basePrice,
    rentalDailyPrice: null,
    rentalPricingStrategy: 'GRID',
    rentalRatesJson: JSON.stringify(rates),
    rentalDurationsJson: JSON.stringify(product.available ? [240, 480] : []),
    rentalSlotStepMinutes: 60,
    rentalDepositAmount: null,
    rentalDepositAllowOnsitePayment: 1,
    rentalDepositAllowOnlinePayment: 0,
    rentalLateFeeEnabled: 0,
    rentalLateFeeMode: 'PER_HOUR_STARTED',
    rentalLateFeeAmount: null,
    rentalLateFeeMultiplier: null,
    rentalLateFeeGraceMinutes: 0,
    rentalLateFeeMinimum: null,
    rentalLateFeeMaximum: null,
    rentalLateFeeVatRate: null,
    unitLabel: 'location',
    unitLabelJson: JSON.stringify(localized('location', 'rental')),
    allowOfflinePayment: 1,
    allowOnlinePayment: 0,
    allowCustomerCancellation: 1,
    allowRefundRequestAfterEngagement: 0,
    active: product.available ? 1 : 0,
    catalogVisible: product.available ? 1 : 0,
    deletedAt: null,
    position,
  }
  const existing = db.prepare('SELECT id FROM Product WHERE slug = ?').get(product.slug)
  const columns = Object.keys(data)
  if (existing) {
    db.prepare(`UPDATE Product SET ${columns.map(column => `"${column}" = ?`).join(', ')}, updatedAt = ? WHERE id = ?`)
      .run(...columns.map(column => data[column]), now, existing.id)
    return Number(existing.id)
  }
  return Number(db.prepare(`INSERT INTO Product (${columns.map(column => `"${column}"`).join(', ')}, createdAt, updatedAt) VALUES (${columns.map(() => '?').join(', ')}, ?, ?)`)
    .run(...columns.map(column => data[column]), now, now).lastInsertRowid)
}

function detailField(id, frLabel, frValue, enLabel, enValue) {
  return {
    id,
    label: frLabel,
    labelLocalized: localized(frLabel, enLabel),
    value: frValue,
    valueLocalized: localized(frValue, enValue),
    mediaKind: null,
    mediaUrl: null,
    mediaDocumentId: null,
    mediaDocumentName: null,
    mediaDocumentKind: null,
  }
}

function pageTranslations(frTitle, enTitle, frMetaTitle, enMetaTitle, frDescription, enDescription, content) {
  return {
    fr: { title: frTitle, navigationLabel: frTitle, seo: { metaTitle: frMetaTitle, metaDescription: frDescription, ogImage: '', noindex: false }, content },
    en: { title: enTitle, navigationLabel: enTitle, seo: { metaTitle: enMetaTitle, metaDescription: enDescription, ogImage: '', noindex: false }, content },
  }
}

function upsertPage({ path, slug, title, pageType, rendererKey, applicationConfig, translations }) {
  const existing = db.prepare('SELECT id FROM CmsPage WHERE path = ? OR slug = ? ORDER BY CASE WHEN path = ? THEN 0 ELSE 1 END LIMIT 1').get(path, slug, path)
  if (existing) {
    db.prepare('UPDATE CmsPage SET path = ?, slug = ?, title = ?, pageType = ?, status = ?, templateKey = ?, rendererKey = ?, applicationPosition = ?, applicationConfigJson = ?, translationsJson = ?, updatedAt = ? WHERE id = ?')
      .run(path, slug, title, pageType, 'PUBLISHED', 'default', rendererKey, 'AFTER_CONTENT', JSON.stringify(applicationConfig), JSON.stringify(translations), now, existing.id)
    return Number(existing.id)
  }
  return Number(db.prepare('INSERT INTO CmsPage (path, slug, title, pageType, status, templateKey, rendererKey, applicationPosition, applicationConfigJson, translationsJson, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(path, slug, title, pageType, 'PUBLISHED', 'default', rendererKey, 'AFTER_CONTENT', JSON.stringify(applicationConfig), JSON.stringify(translations), now, now).lastInsertRowid)
}

function upsertNavigation(href, pageId, fr, en, navigationItemKey, parentItemKey, menu, position) {
  const labels = JSON.stringify({ fr, en, navigationItemKey, parentItemKey })
  const row = db.prepare('SELECT id FROM CmsNavigationItem WHERE href = ? AND menu = ? ORDER BY id LIMIT 1').get(href, menu)
  if (row) {
    db.prepare('UPDATE CmsNavigationItem SET pageId = ?, itemType = ?, title = ?, labelsJson = ?, position = ?, visible = 1, updatedAt = ? WHERE id = ?')
      .run(pageId, 'CMS_PAGE', fr, labels, position, now, row.id)
    return
  }
  db.prepare('INSERT INTO CmsNavigationItem (href, pageId, itemType, title, labelsJson, menu, position, visible, newTab, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)')
    .run(href, pageId, 'CMS_PAGE', fr, labels, menu, position, now, now)
}

function emptyContent() {
  return { version: 1, sections: [] }
}

function section(id, columns, tone = 'base-100', width = 'wide', beforeItems = []) {
  return {
    id,
    type: 'columns',
    columnCount: columns.length,
    enabled: true,
    tone,
    containerWidth: width,
    contentVerticalAlign: 'center',
    minHeightPx: null,
    backgroundColor: null,
    backgroundMode: 'none',
    backgroundImage: { imageUrl: '', alt: localized(''), requestedWidthPx: null, fit: 'cover', verticalAlign: 'center', overlayColor: null, overlayOpacity: 35, blur: false },
    backgroundCarousel: [{ id: `${id}-slide-1`, imageUrl: '', alt: localized(''), fit: 'cover', verticalAlign: 'center' }],
    backgroundCarouselSettings: { autoplay: false, infinite: true, intervalMs: 5000, showArrows: true, showDots: true, animation: 'slide' },
    reverseOnDesktop: false,
    beforeItems,
    afterItems: [],
    columns,
  }
}

function column(items, align = 'start') {
  return { align, verticalAlign: 'center', textColor: null, items }
}

function title(id, fr, en, size = '2xl', headingTag = 'h2') {
  return { id, type: 'title', text: localized(fr, en), size, headingTag, align: 'start', textColor: null }
}

function text(id, fr, en, size = 'md') {
  return { id, type: 'text', text: localized(fr, en), size, align: 'start', textColor: null }
}

function badge(id, fr, en) {
  return { id, type: 'badge', text: localized(fr, en), size: 'sm', backgroundColor: null, textColor: null, borderColor: null }
}

function image(id, imageUrl, frAlt, enAlt, aspect = 'landscape') {
  return { id, type: 'image', imageUrl, alt: localized(frAlt, enAlt), requestedWidthPx: null, aspect, fit: 'cover', verticalAlign: 'center', enlarge: false, framed: true, lightboxEnabled: true }
}

function buttons(id, primary, secondary = null) {
  const button = entry => entry ? { label: localized(entry.fr, entry.en), href: entry.href, tone: entry.tone || 'primary', size: 'md', backgroundColor: null, textColor: null, borderColor: null } : null
  return { id, type: 'buttons', primaryButton: button(primary), secondaryButton: button(secondary) }
}

function card(id, icon, frTitle, enTitle, frText, enText) {
  return {
    id,
    title: localized(frTitle, enTitle),
    text: localized(frText, enText),
    icon,
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
    secondaryButton: null,
  }
}

function cards(id, entries, display = 'grid-3') {
  return { id, type: 'cards', display, cards: entries }
}

function buildHomeContent(boatCategoryId) {
  return {
    version: 1,
    sections: [
      section('artimon-home-hero', [
        column([
          badge('artimon-home-badge', 'Depuis plus de 25 ans à Saint-Cyprien', 'Over 25 years in Saint-Cyprien'),
          title('artimon-home-title', 'La Méditerranée, à votre rythme', 'The Mediterranean, at your own pace', '2xl', 'h1'),
          text('artimon-home-intro', 'Artimon vous accompagne pour une sortie en mer en famille ou entre amis. Choisissez un bateau avec ou sans permis, vos horaires et la durée adaptée à votre programme.', 'Artimon helps you plan a sea trip with family or friends. Choose a licensed or licence-free boat, your schedule and the duration that suits your plans.', 'lg'),
          buttons('artimon-home-actions', { fr: 'Voir les bateaux', en: 'Browse boats', href: '/locations' }, { fr: 'Préparer ma sortie', en: 'Plan my trip', href: '/questions', tone: 'outline' }),
        ]),
        column([image('artimon-home-hero-image', '/uploads/artimon-jeanneau-cap-camarat-75-cc.jpg', 'Bateau Artimon au port de Saint-Cyprien', 'Artimon boat in Saint-Cyprien harbour', 'landscape')]),
      ]),
      section('artimon-home-services', [column([
        cards('artimon-home-service-cards', [
          card('artimon-service-licence-free', 'mdi:account-group-outline', 'Bateaux sans permis', 'Licence-free boats', 'Une prise en main simple pour découvrir la côte en famille, pêcher, nager ou pique-niquer en mer.', 'Easy handling for a family coastal trip, fishing, swimming or a picnic at sea.'),
          card('artimon-service-licence', 'mdi:waves', 'Bateaux avec permis', 'Licensed boats', 'Des unités plus puissantes pour rejoindre les criques, longer la côte rocheuse ou naviguer vers l’Espagne.', 'More powerful boats to reach coves, follow the rocky coast or sail towards Spain.'),
          card('artimon-service-support', 'mdi:information-outline', 'Accompagnement au départ', 'Departure assistance', 'Briefing sécurité, explication du bateau, aide aux manœuvres et présence au retour.', 'Safety briefing, boat walkthrough, manoeuvring assistance and support on return.'),
        ]),
      ])], 'base-200'),
      section('artimon-home-story', [
        column([image('artimon-home-story-image', '/uploads/artimon-selva-d650-family-special.jpg', 'Bateau de location Artimon en Méditerranée', 'Artimon rental boat in the Mediterranean', 'landscape')]),
        column([
          badge('artimon-home-story-badge', 'Artimon Location', 'Artimon Rental'),
          title('artimon-home-story-title', 'Une équipe locale pour une sortie sereine', 'A local team for a smooth trip'),
          text('artimon-home-story-text', 'Installé au port de Saint-Cyprien, Artimon propose une flotte entretenue et du matériel de sécurité adapté. L’équipe vous conseille selon la météo, votre expérience et l’itinéraire envisagé.', 'Based in Saint-Cyprien harbour, Artimon provides a maintained fleet and suitable safety equipment. The team advises you according to the weather, your experience and your planned route.'),
          text('artimon-home-story-location', 'Retrait : 2 Quai Arthur Rimbaud, Ponton F, à côté de la fontaine marine, 66750 Saint-Cyprien.', 'Pickup: 2 Quai Arthur Rimbaud, Pontoon F, next to the marine fountain, 66750 Saint-Cyprien.'),
        ]),
      ]),
      section('artimon-home-products', [column([{
        id: 'artimon-home-product-list',
        type: 'product-list',
        title: localized('Choisissez votre bateau', 'Choose your boat'),
        categoryIds: [boatCategoryId],
        display: 'carousel',
        limit: 6,
        gridColumns: 3,
        showImages: true,
        showDescriptions: true,
      }])]),
      section('artimon-home-experiences', [column([
        title('artimon-home-experiences-title', 'Composez votre journée en mer', 'Plan your day at sea'),
        cards('artimon-home-experience-cards', [
          card('artimon-experience-coast', 'mdi:map-marker-outline', 'Explorer la côte', 'Explore the coast', 'Collioure, Banyuls, Paulilles ou la côte espagnole : adaptez votre destination au bateau et aux conditions.', 'Collioure, Banyuls, Paulilles or the Spanish coast: match your destination to the boat and conditions.'),
          card('artimon-experience-sport', 'mdi:waves', 'Bouée et ski nautique', 'Towable tube and water skiing', 'Ajoutez du matériel nautique à votre sortie lorsque le bateau choisi permet la traction.', 'Add water sports equipment when your selected boat is suitable for towing.'),
          card('artimon-experience-relax', 'mdi:account-group-outline', 'Famille et détente', 'Family and relaxation', 'Baignade, pêche, pique-nique et découverte du littoral à votre propre rythme.', 'Swimming, fishing, picnics and coastal discovery at your own pace.'),
        ]),
        buttons('artimon-home-experience-actions', { fr: 'Voir les accessoires', en: 'Browse accessories', href: '/accessoires' }, { fr: 'Consulter les questions', en: 'Read the FAQ', href: '/questions', tone: 'outline' }),
      ])], 'base-200'),
    ],
  }
}

function buildQuestionsContent() {
  return {
    version: 1,
    sections: [
      section('artimon-questions-hero', [column([
        badge('artimon-questions-badge', 'Préparer votre sortie', 'Plan your trip'),
        title('artimon-questions-title', 'Questions fréquentes', 'Frequently asked questions', '2xl', 'h1'),
        text('artimon-questions-intro', 'Réservation, embarquement, sécurité et navigation : retrouvez les réponses essentielles avant votre départ.', 'Booking, boarding, safety and navigation: find the essential answers before departure.', 'lg'),
      ])]),
      faqSection('artimon-faq-booking', 'Quand et comment réserver ?', 'When and how to book?', [
        card('faq-opening', 'mdi:clock-outline', 'Quelles sont les périodes d’ouverture ?', 'When are you open?', 'L’activité principale s’étend d’avril à octobre. En juillet et août, l’accueil est assuré tous les jours ; hors saison, contactez l’équipe pour confirmer les horaires selon la météo.', 'The main season runs from April to October. In July and August, the team welcomes customers every day; outside peak season, contact the team to confirm weather-dependent opening hours.'),
        card('faq-hours', 'mdi:clock-outline', 'Peut-on choisir son heure de départ ?', 'Can I choose my departure time?', 'Oui. Vous choisissez une heure de départ et une durée disponibles. La durée minimale est d’une heure pour les bateaux proposés à l’heure.', 'Yes. You choose an available departure time and duration. The minimum duration is one hour for boats offered by the hour.'),
        card('faq-advance', 'mdi:information-outline', 'Quand faut-il réserver ?', 'How far ahead should I book?', 'En juillet et août, réservez idéalement une semaine à l’avance. Pour une location longue en haute saison, anticipez davantage.', 'In July and August, ideally book one week ahead. For longer rentals in peak season, plan further ahead.'),
        card('faq-process', 'mdi:information-outline', 'Comment réserver ?', 'How do I book?', 'Choisissez un bateau et un créneau sur le site. En moyenne saison, les réservations sont généralement prises au moins 24 h avant ; en haute saison, au moins 12 h avant.', 'Choose a boat and time slot on the website. In mid-season, bookings are generally made at least 24 hours ahead; in peak season, at least 12 hours ahead.'),
      ]),
      faqSection('artimon-faq-rental', 'Location, paiement et dépôt de garantie', 'Rental, payment and security deposit', [
        card('faq-contract', 'mdi:information-outline', 'Que faut-il apporter ?', 'What should I bring?', 'Une pièce d’identité, le règlement, le dépôt de garantie et un téléphone portable qui restera à bord pendant la navigation.', 'Bring an ID document, payment, the security deposit and a mobile phone that will remain on board during the trip.'),
        card('faq-payment', 'mdi:information-outline', 'Quels moyens de paiement sont acceptés ?', 'Which payment methods are accepted?', 'Espèces, carte bancaire, Chèques-Vacances ANCV et ANCV Connect sont acceptés selon les modalités indiquées lors de la réservation.', 'Cash, bank cards, ANCV holiday vouchers and ANCV Connect are accepted according to the booking terms.'),
        card('faq-deposit', 'mdi:information-outline', 'À quoi sert le dépôt de garantie ?', 'What is the security deposit for?', 'Le dépôt de garantie couvre notamment la franchise prévue par l’assurance. Une préautorisation bancaire peut être demandée avant le départ.', 'The security deposit notably covers the insurance excess. A card pre-authorisation may be requested before departure.'),
        card('faq-boarding', 'mdi:waves', 'Comment se passe l’embarquement ?', 'How does boarding work?', 'Après l’état des lieux, l’équipe explique le fonctionnement, les règles de sécurité et les manœuvres. Elle vous assiste au départ et au retour.', 'After the condition report, the team explains operation, safety rules and manoeuvres. Assistance is provided on departure and return.'),
      ]),
      faqSection('artimon-faq-safety', 'Sécurité et réglementation', 'Safety and regulations', [
        card('faq-safety-equipment', 'mdi:information-outline', 'Le matériel de sécurité est-il fourni ?', 'Is safety equipment provided?', 'Oui. Les bateaux avec permis sont équipés pour naviguer jusqu’à 6 milles d’un abri, et les bateaux sans permis jusqu’à 2 milles. Des gilets adaptés aux enfants sont disponibles.', 'Yes. Licensed boats are equipped for navigation up to 6 miles from shelter, and licence-free boats up to 2 miles. Children’s life jackets are available.'),
        card('faq-children', 'mdi:account-group-outline', 'Les enfants comptent-ils comme passagers ?', 'Do children count as passengers?', 'Oui, y compris les nouveau-nés. Respectez toujours la capacité maximale indiquée sur la fiche du bateau.', 'Yes, including newborns. Always follow the maximum capacity shown on the boat page.'),
        card('faq-breakdown', 'mdi:information-outline', 'Que faire en cas de problème en mer ?', 'What should I do if there is a problem at sea?', 'Gardez un téléphone portable à bord et contactez immédiatement Artimon. De nombreux incidents mineurs peuvent être résolus par téléphone ; l’équipe peut intervenir si nécessaire.', 'Keep a mobile phone on board and contact Artimon immediately. Many minor issues can be resolved by phone; the team can intervene if required.'),
        card('faq-permit', 'mdi:information-outline', 'Un permis étranger est-il accepté ?', 'Is a foreign licence accepted?', 'Les permis étrangers sont généralement acceptés. Transmettez votre document avant la location en cas de doute afin que l’équipe puisse le vérifier.', 'Foreign licences are generally accepted. Send your document before the rental if in doubt so the team can check it.'),
      ]),
      faqSection('artimon-faq-navigation', 'Naviguer et profiter de la sortie', 'Navigation and enjoying your trip', [
        card('faq-no-licence', 'mdi:waves', 'Faut-il savoir conduire pour louer sans permis ?', 'Do I need experience for a licence-free boat?', 'Non. La conduite est simple et une prise en main est réalisée avant le départ. Toute personne adulte peut conduire ; les mineurs doivent être accompagnés ou autorisés.', 'No. Handling is simple and explained before departure. Any adult may drive; minors must be accompanied or authorised.'),
        card('faq-weather', 'mdi:information-outline', 'Comment vérifier la météo ?', 'How do I check the weather?', 'Consultez la météo marine et échangez avec l’équipe avant le départ. La sortie reste conditionnée à des conditions compatibles avec le bateau et l’expérience du navigateur.', 'Check the marine forecast and speak with the team before departure. The trip depends on conditions suitable for the boat and skipper’s experience.'),
        card('faq-destinations', 'mdi:map-marker-outline', 'Où naviguer ?', 'Where can I sail?', 'Selon la durée et le bateau : port de Saint-Cyprien, Collioure, côte rocheuse, Paulilles, Banyuls ou côte espagnole. L’équipe vous aide à choisir un itinéraire réaliste.', 'Depending on duration and boat: Saint-Cyprien harbour, Collioure, the rocky coast, Paulilles, Banyuls or the Spanish coast. The team helps you choose a realistic route.'),
        card('faq-activities', 'mdi:waves', 'Que peut-on faire en bateau ?', 'What can I do by boat?', 'Baignade, pêche, pique-nique, découverte du littoral et, avec un bateau compatible, bouée tractée ou ski nautique.', 'Swimming, fishing, picnics, coastal discovery and, with a suitable boat, towable tubing or water skiing.'),
        card('faq-pets', 'mdi:information-outline', 'Les animaux sont-ils acceptés ?', 'Are pets accepted?', 'Les animaux domestiques ne sont pas acceptés à bord.', 'Pets are not accepted on board.'),
      ]),
      section('artimon-questions-cta', [column([
        title('artimon-questions-cta-title', 'Une question reste sans réponse ?', 'Still have a question?'),
        text('artimon-questions-cta-text', 'Contactez Artimon avant de réserver : l’équipe vous orientera vers le bateau, la durée et l’itinéraire les plus adaptés.', 'Contact Artimon before booking: the team will help you choose the most suitable boat, duration and route.'),
        buttons('artimon-questions-cta-buttons', { fr: 'Nous contacter', en: 'Contact us', href: '/contact' }, { fr: 'Voir les bateaux', en: 'Browse boats', href: '/locations', tone: 'outline' }),
      ])], 'base-200'),
    ],
  }
}

function faqSection(id, frTitle, enTitle, entries) {
  return section(id, [column([cards(`${id}-cards`, entries, 'grid-2')])], 'base-100', 'wide', [title(`${id}-title`, frTitle, enTitle)])
}

function upsertImageUsage(imageId, scopeType, scopeId, fieldKey, label) {
  const row = db.prepare('SELECT id FROM ImageUsage WHERE imageId = ? AND scopeType = ? AND scopeId = ? AND fieldKey = ?').get(imageId, scopeType, scopeId, fieldKey)
  if (row) {
    db.prepare('UPDATE ImageUsage SET label = ?, updatedAt = ? WHERE id = ?').run(label, now, row.id)
    return
  }
  db.prepare('INSERT INTO ImageUsage (imageId, scopeType, scopeId, fieldKey, label, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(imageId, scopeType, scopeId, fieldKey, label, now, now)
}

function syncCmsPageImageUsages(pageId, usages) {
  db.prepare('DELETE FROM ImageUsage WHERE scopeType = ? AND scopeId = ?').run('cms-page', String(pageId))
  for (const [fieldKey, imageUrl, label] of usages) {
    const image = db.prepare('SELECT id FROM Image WHERE url = ? ORDER BY id LIMIT 1').get(imageUrl)
    if (image) upsertImageUsage(Number(image.id), 'cms-page', String(pageId), fieldKey, label)
  }
}
