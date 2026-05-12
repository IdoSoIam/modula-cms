import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const rootDir = process.cwd()
const d1Dir = path.join(rootDir, '.wrangler', 'state', 'v3', 'd1', 'miniflare-D1DatabaseObject')

function findD1DatabaseFile() {
  const entries = fs.readdirSync(d1Dir, { withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(d1Dir, entry.name))
    .filter((filePath) => !path.basename(filePath).startsWith('metadata.sqlite'))

  for (const filePath of files) {
    try {
      const db = new Database(filePath, { readonly: true })
      const hasSiteParams = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='SiteParams'").get()
      const hasCmsPage = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='CmsPage'").get()
      db.close()
      if (hasSiteParams && hasCmsPage) {
        return filePath
      }
    } catch {
      // Ignore non SQLite files.
    }
  }

  throw new Error(`Impossible de trouver la base D1 locale dans ${d1Dir}`)
}

function getSetting(db, key) {
  const row = db.prepare('SELECT value FROM SiteParams WHERE key = ?').get(key)
  return typeof row?.value === 'string' ? row.value : null
}

function setSetting(db, key, value) {
  db.prepare(`
    INSERT INTO SiteParams ("key", "value", "createdAt", "updatedAt")
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT("key") DO UPDATE SET
      "value" = excluded."value",
      "updatedAt" = CURRENT_TIMESTAMP
  `).run(key, value)
}

function createLocalizedText(fr, en = fr) {
  return { fr, en }
}

function createFooterBlock(type, index, extra = {}) {
  return {
    id: `footer-block-${type}-${index}`,
    type,
    title: createLocalizedText(''),
    text: createLocalizedText(''),
    navigationMenu: 'FOOTER',
    ...extra
  }
}

function createDesiredFooterColumns() {
  return [
    {
      id: 'footer-col-1',
      title: createLocalizedText('La ferme'),
      text: createLocalizedText(''),
      image: null,
      links: [],
      showOpeningHours: false,
      showContactDetails: false,
      showSocialLinks: false,
      showFooterNavigation: false,
      align: 'start',
      verticalAlign: 'start',
      gapPx: 16,
      blocks: [
        createFooterBlock('logo', 1),
        createFooterBlock('site-name', 2),
        createFooterBlock('site-tagline', 3)
      ]
    },
    {
      id: 'footer-col-2',
      title: createLocalizedText('Horaires', 'Opening hours'),
      text: createLocalizedText(''),
      image: null,
      links: [],
      showOpeningHours: false,
      showContactDetails: false,
      showSocialLinks: false,
      showFooterNavigation: false,
      align: 'start',
      verticalAlign: 'start',
      gapPx: 20,
      blocks: [
        createFooterBlock('title', 1, { text: createLocalizedText('Horaires', 'Opening hours') }),
        createFooterBlock('text', 2, { text: createLocalizedText('Vente directe à la ferme', 'Direct sale at the farm') }),
        createFooterBlock('opening-hours', 3),
        createFooterBlock('text', 4, { text: createLocalizedText('Marché de Saint-Sébastien-d\'Aigrefeuille', 'Saint-Sébastien-d\'Aigrefeuille market') }),
        createFooterBlock('text', 5, { text: createLocalizedText('Tous les samedi de 9h30 à 12h00', 'Every Saturday from 9:30h to 12:00h') })
      ]
    },
    {
      id: 'footer-col-3',
      title: createLocalizedText('Contact'),
      text: createLocalizedText(''),
      image: null,
      links: [],
      showOpeningHours: false,
      showContactDetails: false,
      showSocialLinks: false,
      showFooterNavigation: false,
      align: 'start',
      verticalAlign: 'start',
      gapPx: 16,
      blocks: [
        createFooterBlock('title', 1, { text: createLocalizedText('Contact') }),
        createFooterBlock('text', 2, { text: createLocalizedText('Ferme du Campeyrigoux\n30140 Saint-Sébastien-d\'Aigrefeuille') }),
        createFooterBlock('text', 3, { text: createLocalizedText('07 68 55 06 64') }),
        createFooterBlock('text', 4, { text: createLocalizedText('ferme.campeyrigoux@gmail.com') })
      ]
    },
    {
      id: 'footer-col-4',
      title: createLocalizedText('Suivez-nous', 'Follow us'),
      text: createLocalizedText(''),
      image: null,
      links: [],
      showOpeningHours: false,
      showContactDetails: false,
      showSocialLinks: false,
      showFooterNavigation: false,
      align: 'start',
      verticalAlign: 'start',
      gapPx: 16,
      blocks: [
        createFooterBlock('title', 1, { text: createLocalizedText('Suivez-nous', 'Follow us') }),
        createFooterBlock('social-links', 2)
      ]
    }
  ]
}

function buildCmsSiteSettings(existingSettings) {
  const current = existingSettings && typeof existingSettings === 'object' ? existingSettings : {}
  return {
    ...current,
    siteName: createLocalizedText('Ferme du Campeyrigoux'),
    siteTagline: createLocalizedText('Agriculture biologique depuis 2024', 'Organic farming since 2024'),
    footer: {
      ...(current.footer && typeof current.footer === 'object' ? current.footer : {}),
      containerWidth: 'xwide',
      containerAlign: 'between',
      columns: createDesiredFooterColumns()
    }
  }
}

function buildHomeTranslations(homeContent) {
  return {
    fr: {
      title: 'Accueil',
      navigationLabel: 'Accueil',
      seo: {
        metaTitle: 'Légumes bio, paniers et vente à la ferme',
        metaDescription: 'Découvrez les légumes bio de saison, la vente à la ferme et la réservation de paniers à la Ferme du Campeyrigoux.',
        ogImage: '',
        noindex: false
      },
      content: homeContent
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
      content: homeContent
    }
  }
}

function ensureHomeCmsPage(db, homeContent) {
  const translationsJson = JSON.stringify(buildHomeTranslations(homeContent))
  const existing = db.prepare('SELECT id FROM CmsPage WHERE path = ?').get('/')

  if (existing?.id) {
    db.prepare(`
      UPDATE CmsPage
      SET slug = ?, title = ?, pageType = ?, status = ?, templateKey = ?, rendererKey = ?, applicationPosition = ?, translationsJson = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      'home',
      'Accueil',
      'CMS',
      'PUBLISHED',
      'default',
      null,
      'AFTER_CONTENT',
      translationsJson,
      existing.id
    )
    return existing.id
  }

  const info = db.prepare(`
    INSERT INTO CmsPage (path, slug, title, pageType, status, templateKey, rendererKey, applicationPosition, translationsJson, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(
    '/',
    'home',
    'Accueil',
    'CMS',
    'PUBLISHED',
    'default',
    null,
    'AFTER_CONTENT',
    translationsJson
  )

  return Number(info.lastInsertRowid)
}

function main() {
  const dbPath = findD1DatabaseFile()
  const db = new Database(dbPath)

  try {
    const homeContentRaw = getSetting(db, 'home_page_content_v1')
    if (!homeContentRaw) {
      throw new Error('La clé SiteParams home_page_content_v1 est introuvable.')
    }

    const homeContent = JSON.parse(homeContentRaw)
    const currentCmsSettingsRaw = getSetting(db, 'cms_site_settings_v1')
    const currentCmsSettings = currentCmsSettingsRaw ? JSON.parse(currentCmsSettingsRaw) : null
    const cmsSettings = buildCmsSiteSettings(currentCmsSettings)

    const transaction = db.transaction(() => {
      setSetting(db, 'cms_site_settings_v1', JSON.stringify(cmsSettings))
      return ensureHomeCmsPage(db, homeContent)
    })

    const homePageId = transaction()
    console.log(JSON.stringify({
      database: dbPath,
      homePageId,
      updatedSetting: 'cms_site_settings_v1'
    }, null, 2))
  } finally {
    db.close()
  }
}

main()
