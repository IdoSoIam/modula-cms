#!/usr/bin/env node
import Database from 'better-sqlite3'
import { mkdir, writeFile } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'

const databasePath = resolve(process.cwd(), process.env.CMS_SQLITE_PATH || '.data/sqlite/local.db')
const uploadsDir = resolve(process.cwd(), process.env.CMS_FILESYSTEM_STORAGE_DIR || 'public/uploads')
const db = new Database(databasePath)
const now = new Date().toISOString()

const boats = [
  boat('jeanneau-cap-camarat-47-cc', 'Jeanneau Cap Camarat 4.7 CC', 3731, 'ARTIMON 2', 'Jeanneau', 'Cap Camarat 4.7 CC', 'Open sans cabine', 4.65, 5, 6, false, 20, 3, 600, [62, 102, 135, 171, 192, 204, 200, 205], [389, 570, 740, 910, 1080, 1250], ['Échelle de bain'], 'https://cdn.nauticmanager.com/announcements_pictures/6801ffa1e1102-o.jpeg', 'Formule matin 7 h–11 h : 151 € TTC, carburant inclus.'),
  boat('b2-marine-cap-ferret-472-cc', 'B² Marine Cap Ferret 472 CC', 3737, 'ARTIMON 1', 'B² Marine', 'Cap Ferret 472 Open', 'Open sans cabine', 4.72, 5, 6, false, 20, 3, 600, [66, 108, 139, 176, 199, 209, 206, 210], [400, 586, 761, 936, 1111, 1288], ['Plateforme de bain', 'Taud de soleil', 'Échelle de bain', 'Mouillage'], 'https://cdn.nauticmanager.com/announcements_pictures/6801ffad793e6-o.jpeg', 'Formule matin 7 h–11 h : 151 € TTC, carburant inclus.'),
  boat('pacific-craft-500-open-ar9', 'Pacific Craft 500 Open – AR 9', 7689, 'ARTIMON 9', 'Pacific Craft', 'Pacific Craft 500', 'Open sans cabine', 5, 5, 70, true, 60, 10, 800, [98, 160, 165, 185, 198, 215, 230, 255], [486, 711, 924, 1137, 1350, 1563], ['Taud de soleil', 'Échelle de bain', 'Mât de ski', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6801ff9f758be-o.jpeg', 'Formule matin 7 h–11 h : 215 € TTC, carburant inclus. Bouée tractée et skis nautiques proposés en supplément.'),
  boat('pacific-craft-545-open', 'Pacific Craft 545 Open', 3723, 'ARTIMON 11', 'Pacific Craft', '545 Open', 'Open sans cabine', 5.39, 6, 100, true, 98, 12, 1000, [135, 155, 180, 210, 230, 252, 274, 310], [590, 864, 1123, 1382, 1641, 1900], ['Taud de soleil', 'Échelle de bain', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6a50fa2552b08-o.jpeg', 'Bouée tractée et skis nautiques proposés en supplément.'),
  boat('grand-580-golden-line', 'Grand 580 Golden Line', 7955, 'ARTIMON 10', 'Grand', '580 Golden Line', 'Semi-rigide', 5.8, 6, 115, true, 90, 12, 1000, [135, 155, 180, 210, 230, 252, 274, 310], [590, 864, 1123, 1382, 1641, 1900], ['Taud de soleil', 'Échelle de bain', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6a50b1ab24f1d-o.jpeg', 'Bouée tractée et skis nautiques proposés en supplément. La capacité du réservoir est indiquée à 90 L sur le site Artimon et 98 L sur NauticManager : donnée à confirmer.'),
  boat('selva-d650-family-special', 'Selva D 650 Family Special', 3738, 'ARTIMON 14', 'Selva', 'D 650 Family Special', 'Semi-rigide', 6.58, 8, 150, true, 250, 18, 2000, [168, 189, 230, 265, 286, 312, 340, 360], [686, 1003, 1304, 1605, 1905, 2206], ['Taud de soleil', 'Échelle de bain', 'Mât de ski', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6801ffae2375a-o.jpeg'),
  boat('pacific-craft-670-open-ar16', 'Pacific Craft 670 Open – AR 16', 3736, 'ARTIMON 16', 'Pacific Craft', '670 Open', 'Open sans cabine', 6.65, 10, 175, true, 192, 17, 2000, [178, 200, 240, 295, 325, 340, 355, 385], [733, 1073, 1395, 1716, 2038, 2359], ['Taud de soleil', 'Échelle de bain', 'Mât de ski', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6801ffacd9cff-o.jpeg', 'Bouée tractée et skis nautiques proposés en supplément.'),
  boat('pacific-craft-670-open-ar15', 'Pacific Craft 670 Open – AR 15', 3739, 'ARTIMON 15', 'Pacific Craft', '670 Open', 'Open sans cabine', 6.65, 10, 175, true, 192, 17, 2000, [178, 200, 240, 295, 325, 340, 355, 385], [733, 1073, 1395, 1716, 2038, 2359], ['Taud de soleil', 'Échelle de bain', 'Mât de ski', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6801ffaeb004c-o.jpeg', 'Bouée tractée et skis nautiques proposés en supplément.'),
  boat('grand-750-golden-line', 'Grand 750 Golden Line', 7951, 'ARTIMON 18', 'Grand', '750 Golden Line', 'Semi-rigide', 7.3, 10, 225, true, 260, 25, 3000, [215, 228, 263, 350, 370, 395, 460, 490], [933, 1366, 1775, 2184, 2594, 3003], ['Taud de soleil', 'Échelle de bain', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/6a4266701bca7-o.jpeg'),
  boat('jeanneau-cap-camarat-75-cc', 'Jeanneau Cap Camarat 7.5 CC', 3722, 'ARTIMON 20', 'Jeanneau', 'Cap Camarat 7.5 CC', 'Open sans cabine', 7.42, 8, 250, true, 280, 25, 3000, [215, 228, 263, 350, 370, 395, 460, 490], [933, 1366, 1775, 2184, 2594, 3003], ['Taud de soleil', 'Échelle de bain', 'Mât de ski', 'Compas'], 'https://cdn.nauticmanager.com/announcements_pictures/69da56eb8ce63-o.jpeg', 'Bouée tractée et skis nautiques proposés en supplément.'),
]

await mkdir(uploadsDir, { recursive: true })
const categoryId = ensureCategory()
const report = []

for (const [position, product] of boats.entries()) {
  const filename = `artimon-${product.slug}.jpg`
  const imageUrl = `/uploads/${filename}`
  const image = await downloadImage(product.sourceImageUrl, filename)
  upsertImage(filename, imageUrl, image)
  const id = upsertProduct(product, categoryId, position + 1, imageUrl)
  upsertImageUsage(imageUrl, id, product.name)
  report.push({ id, slug: product.slug, name: product.name, image: imageUrl })
}

console.log(JSON.stringify({ databasePath, imported: report.length, products: report }, null, 2))
db.close()

function boat(slug, name, nauticalManagerId, fleetName, manufacturer, model, type, length, capacity, enginePower, permitRequired, tankCapacity, consumption, deposit, hourlyPrices, dailyPrices, equipment, sourceImageUrl, notes = '') {
  return { slug, name, nauticalManagerId, fleetName, manufacturer, model, type, length, capacity, enginePower, permitRequired, tankCapacity, consumption, deposit, hourlyPrices, dailyPrices, equipment, sourceImageUrl, notes }
}

function localized(value) {
  return { fr: value, en: '' }
}

function field(id, label, value) {
  return { id, label, labelLocalized: localized(label), value: String(value), valueLocalized: localized(String(value)), mediaKind: null, mediaUrl: null, mediaDocumentId: null, mediaDocumentName: null, mediaDocumentKind: null }
}

function buildDetails(product) {
  const technical = [
    field('manufacturer', 'Constructeur', product.manufacturer),
    field('model', 'Modèle', product.model),
    field('type', 'Type', product.type),
    field('length', 'Longueur', `${product.length.toLocaleString('fr-FR')} m`),
    field('capacity', 'Capacité maximale', `${product.capacity} personnes`),
    field('engine', 'Motorisation', `${product.enginePower} CV`),
    field('permit', 'Permis requis', product.permitRequired ? 'Oui' : 'Non'),
    field('tank', 'Réservoir', `${product.tankCapacity} L`),
    field('consumption', 'Consommation indicative', `${product.consumption} L/h`),
  ]
  const conditions = [
    field('fleet-name', 'Référence de flotte', product.fleetName),
    field('pickup', 'Lieu de retrait', '2 Quai Arthur Rimbaud, Ponton F, 66750 Saint-Cyprien'),
    field('contact', 'Contact', '+33 6 86 38 46 65 · artimon.saintcyprien@free.fr'),
    field('pricing-note', 'Tarification', 'Prix TTC. Carburant, nettoyage, retard et options éventuelles facturés selon les conditions du loueur.'),
    field('source', 'Fiche de réservation', `https://shop.nauticmanager.com/artimon/announcements/${product.nauticalManagerId}`),
  ]
  if (product.notes) conditions.push(field('notes', 'Informations complémentaires', product.notes))
  return [
    { id: 'technical-characteristics', title: 'Caractéristiques', titleLocalized: localized('Caractéristiques'), items: technical },
    { id: 'equipment', title: 'Équipements inclus', titleLocalized: localized('Équipements inclus'), items: [field('equipment-list', 'Équipements', product.equipment.join(' · '))] },
    { id: 'rental-conditions', title: 'Informations pratiques', titleLocalized: localized('Informations pratiques'), items: conditions },
  ]
}

function buildRates(product) {
  return [
    ...product.hourlyPrices.map((price, index) => ({ pricingMode: 'HOURLY', duration: (index + 1) * 60, price })),
    ...product.dailyPrices.map((price, index) => ({ pricingMode: 'DAILY', duration: index + 2, price })),
  ]
}

function ensureCategory() {
  const existing = db.prepare('SELECT id FROM ProductCategory WHERE slug = ? OR lower(name) = lower(?) ORDER BY id LIMIT 1').get('boat', 'Bateau')
  if (existing) return Number(existing.id)
  const result = db.prepare('INSERT INTO ProductCategory (name, slug, description, position, active, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run('Bateau', 'boat', 'Bateaux disponibles à la location', 1, 1, now, now)
  return Number(result.lastInsertRowid)
}

async function downloadImage(url, filename) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Téléchargement impossible (${response.status}) : ${url}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  await writeFile(join(uploadsDir, filename), buffer)
  return { buffer, mimeType: response.headers.get('content-type')?.split(';')[0] || 'image/jpeg' }
}

function upsertImage(filename, url, image) {
  const existing = db.prepare('SELECT id FROM Image WHERE url = ? ORDER BY id LIMIT 1').get(url)
  if (existing) {
    db.prepare('UPDATE Image SET filename = ?, mimeType = ?, size = ? WHERE id = ?').run(filename, image.mimeType, image.buffer.length, existing.id)
    return Number(existing.id)
  }
  return Number(db.prepare('INSERT INTO Image (filename, url, mimeType, size, width, height, uploadedById, createdAt) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?)').run(filename, url, image.mimeType, image.buffer.length, now).lastInsertRowid)
}

function upsertProduct(product, categoryId, position, imageUrl) {
  const rates = buildRates(product)
  const data = {
    name: product.name,
    nameJson: JSON.stringify(localized(product.name)),
    slug: product.slug,
    saleType: 'RENTAL',
    categoryId,
    excerpt: `${product.capacity} personnes · ${product.enginePower} CV · ${product.length.toLocaleString('fr-FR')} m${product.permitRequired ? ' · permis requis' : ' · sans permis'}`,
    excerptJson: JSON.stringify(localized(`${product.capacity} personnes · ${product.enginePower} CV · ${product.length.toLocaleString('fr-FR')} m${product.permitRequired ? ' · permis requis' : ' · sans permis'}`)),
    description: `Louez le ${product.name} au départ de Saint-Cyprien. Consultez les caractéristiques, les équipements et choisissez une durée disponible.`,
    descriptionJson: JSON.stringify(localized(`Louez le ${product.name} au départ de Saint-Cyprien. Consultez les caractéristiques, les équipements et choisissez une durée disponible.`)),
    detailsJson: JSON.stringify(buildDetails(product)),
    imageUrl,
    price: product.hourlyPrices[0],
    vatRate: 20,
    stock: 1,
    rentalMinDays: 2,
    rentalMaxDays: 7,
    rentalBookingMode: 'BOTH',
    rentalApprovalMode: 'MANUAL',
    rentalHourlyPrice: product.hourlyPrices[0],
    rentalDailyPrice: product.dailyPrices[0] / 2,
    rentalPricingStrategy: 'GRID',
    rentalRatesJson: JSON.stringify(rates),
    rentalDurationsJson: JSON.stringify(product.hourlyPrices.map((_, index) => (index + 1) * 60)),
    rentalSlotStepMinutes: 60,
    rentalDepositAmount: product.deposit,
    rentalDepositAllowOnsitePayment: 1,
    rentalDepositAllowOnlinePayment: 0,
    rentalLateFeeEnabled: 0,
    unitLabel: 'location',
    unitLabelJson: JSON.stringify(localized('location')),
    allowOfflinePayment: 1,
    allowOnlinePayment: 0,
    allowCustomerCancellation: 1,
    allowRefundRequestAfterEngagement: 0,
    active: 1,
    catalogVisible: 1,
    deletedAt: null,
    position,
  }
  const existing = db.prepare('SELECT id FROM Product WHERE slug = ?').get(product.slug)
  const columns = Object.keys(data)
  if (existing) {
    db.prepare(`UPDATE Product SET ${columns.map(column => `"${column}" = ?`).join(', ')}, updatedAt = ? WHERE id = ?`).run(...columns.map(column => data[column]), now, existing.id)
    return Number(existing.id)
  }
  const result = db.prepare(`INSERT INTO Product (${columns.map(column => `"${column}"`).join(', ')}, createdAt, updatedAt) VALUES (${columns.map(() => '?').join(', ')}, ?, ?)`).run(...columns.map(column => data[column]), now, now)
  return Number(result.lastInsertRowid)
}

function upsertImageUsage(imageUrl, productId, productName) {
  const image = db.prepare('SELECT id FROM Image WHERE url = ? ORDER BY id LIMIT 1').get(imageUrl)
  if (!image) return
  const existing = db.prepare('SELECT id FROM ImageUsage WHERE imageId = ? AND scopeType = ? AND scopeId = ? AND fieldKey = ?').get(image.id, 'product', String(productId), 'imageUrl')
  if (existing) {
    db.prepare('UPDATE ImageUsage SET label = ?, updatedAt = ? WHERE id = ?').run(productName, now, existing.id)
    return
  }
  db.prepare('INSERT INTO ImageUsage (imageId, scopeType, scopeId, fieldKey, label, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(image.id, 'product', String(productId), 'imageUrl', productName, now, now)
}
