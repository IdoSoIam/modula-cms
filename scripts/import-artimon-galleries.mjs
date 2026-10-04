#!/usr/bin/env node
import Database from 'better-sqlite3'
import { createHash } from 'node:crypto'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'

const databasePath = resolve(process.cwd(), process.env.CMS_SQLITE_PATH || '.data/sqlite/local.db')
const publicDir = resolve(process.cwd(), 'public')
const uploadsDir = resolve(process.cwd(), process.env.CMS_FILESYSTEM_STORAGE_DIR || 'public/uploads')
const stagingDir = join(uploadsDir, `.artimon-galleries-${Date.now()}`)
const db = new Database(databasePath)
const now = new Date().toISOString()

const galleries = [
  gallery('jeanneau-cap-camarat-47-cc', 3731, [
    '6801ffa1e1102-o.jpeg', '6801ffa2ae105-o.png', '6801ffa526d84-o.png',
    '6801ffa6e2e90-o.png', '6801ffa965198-o.png', '6801ffab8a6a0-o.jpeg',
  ]),
  gallery('b2-marine-cap-ferret-472-cc', 3737, [
    '6801ffad793e6-o.jpeg', '6801ffad9ecd4-o.jpeg', '6801ffadc4f9a-o.jpeg', '6801ffadeb776-o.jpeg',
  ]),
  gallery('pacific-craft-500-open-ar9', 7689, [
    '6801ff9f758be-o.jpeg', '6801ff9fa0a14-o.jpeg', '6801ff9fcc795-o.jpeg',
    '6801ff9fec89e-o.jpeg', '6801ffa01d95e-o.jpeg', '6801ffa04ca33-o.jpeg',
  ]),
  gallery('pacific-craft-545-open', 3723, [
    '6a50fa2552b08-o.jpeg', '6a50fa2f5ec99-o.jpeg', '6a50fa4a6d470-o.jpeg', '6a50fa5ac39a0-o.jpeg',
  ]),
  gallery('grand-580-golden-line', 7955, [
    '6a50b1ab24f1d-o.jpeg', '6a50b1b8b7da3-o.jpeg', '6a50b1cf06270-o.jpeg', '6a50b1e6693ac-o.jpeg',
  ]),
  gallery('selva-d650-family-special', 3738, [
    '6801ffae2375a-o.jpeg', '6801ffae4463a-o.jpeg', '6801ffae64120-o.jpeg', '6801ffae84469-o.jpeg',
  ]),
  gallery('pacific-craft-670-open-ar16', 3736, [
    '6801ffacd9cff-o.jpeg', '6801ffad060eb-o.jpeg', '6801ffad2612a-o.jpeg', '6801ffad4af19-o.jpeg',
  ]),
  gallery('pacific-craft-670-open-ar15', 3739, [
    '6801ffaeb004c-o.jpeg', '6801ffaecd284-o.jpeg', '6801ffaeee651-o.jpeg', '6801ffaf217f5-o.jpeg',
  ]),
  gallery('grand-750-golden-line', 7951, [
    '6a4266701bca7-o.jpeg', '6a426675138f8-o.jpeg',
  ]),
  gallery('jeanneau-cap-camarat-75-cc', 3722, [
    '69da56eb8ce63-o.jpeg', '69da567c1c188-o.jpeg', '69da569852c68-o.jpeg',
    '69da56ab88153-o.jpeg', '69da56b66cab2-o.jpeg', '69da56bd713f8-o.jpeg',
    '69da56c4747ac-o.jpeg', '69da56d17065c-o.jpeg', '69da56dcd7efa-o.jpeg', '69da56e5180e2-o.jpeg',
  ]),
]

try {
  await mkdir(stagingDir, { recursive: true })
  const prepared = []

  for (const source of galleries) {
    const product = db.prepare(
      'SELECT id, name, slug, imageUrl FROM Product WHERE slug = ? AND deletedAt IS NULL LIMIT 1',
    ).get(source.slug)
    if (!product) throw new Error(`Produit introuvable : ${source.slug}`)

    const knownHashes = new Set()
    if (product.imageUrl?.startsWith('/uploads/')) {
      const primaryPath = resolve(publicDir, product.imageUrl.replace(/^\/+/, ''))
      knownHashes.add(hash(await readFile(primaryPath)))
    }

    const images = []
    for (const sourceUrl of source.urls) {
      const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'ModulaCMS Artimon gallery importer' } })
      if (!response.ok) throw new Error(`Téléchargement impossible (${response.status}) : ${sourceUrl}`)
      const buffer = Buffer.from(await response.arrayBuffer())
      const digest = hash(buffer)
      if (knownHashes.has(digest)) continue
      knownHashes.add(digest)

      const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || mimeFromUrl(sourceUrl)
      const extension = extensionFor(mimeType, sourceUrl)
      const order = images.length + 1
      const filename = `artimon-${source.slug}-gallery-${String(order).padStart(2, '0')}.${extension}`
      await writeFile(join(stagingDir, filename), buffer)
      images.push({ filename, url: `/uploads/${filename}`, mimeType, size: buffer.length, sourceUrl })
    }

    prepared.push({ product, announcementId: source.announcementId, images })
  }

  for (const entry of prepared) {
    for (const image of entry.images) {
      const destination = join(uploadsDir, image.filename)
      await rm(destination, { force: true })
      await rename(join(stagingDir, image.filename), destination)
    }
  }

  const persist = db.transaction(() => {
    for (const entry of prepared) {
      const urls = entry.images.map(image => image.url)
      db.prepare('UPDATE Product SET galleryJson = ?, updatedAt = ? WHERE id = ?')
        .run(JSON.stringify(urls), now, entry.product.id)
      db.prepare("DELETE FROM ImageUsage WHERE scopeType = 'product' AND scopeId = ? AND fieldKey LIKE 'gallery:%'")
        .run(String(entry.product.id))

      entry.images.forEach((image, index) => {
        const existing = db.prepare('SELECT id FROM Image WHERE url = ? ORDER BY id LIMIT 1').get(image.url)
        const imageId = existing
          ? Number(existing.id)
          : Number(db.prepare(
              'INSERT INTO Image (filename, url, mimeType, size, width, height, uploadedById, createdAt) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?)',
            ).run(image.filename, image.url, image.mimeType, image.size, now).lastInsertRowid)
        if (existing) {
          db.prepare('UPDATE Image SET filename = ?, mimeType = ?, size = ? WHERE id = ?')
            .run(image.filename, image.mimeType, image.size, imageId)
        }
        db.prepare(
          'INSERT INTO ImageUsage (imageId, scopeType, scopeId, fieldKey, label, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).run(imageId, 'product', String(entry.product.id), `gallery:${index}`, `Produit "${entry.product.name}" - galerie ${index + 1}`, now, now)
      })
    }
  })
  persist()

  console.log(JSON.stringify({
    databasePath,
    source: 'NauticManager / Artimon',
    products: prepared.map(entry => ({
      id: entry.product.id,
      slug: entry.product.slug,
      announcementId: entry.announcementId,
      galleryImages: entry.images.length,
    })),
    totalGalleryImages: prepared.reduce((total, entry) => total + entry.images.length, 0),
  }, null, 2))
} finally {
  await rm(stagingDir, { recursive: true, force: true })
  db.close()
}

function gallery(slug, announcementId, filenames) {
  return {
    slug,
    announcementId,
    urls: filenames.map(filename => `https://cdn.nauticmanager.com/announcements_pictures/${filename}`),
  }
}

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

function mimeFromUrl(url) {
  return extname(new URL(url).pathname).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg'
}

function extensionFor(mimeType, url) {
  if (mimeType === 'image/png') return 'png'
  if (mimeType === 'image/webp') return 'webp'
  if (mimeType === 'image/avif') return 'avif'
  return ['.jpg', '.jpeg'].includes(extname(basename(new URL(url).pathname)).toLowerCase()) ? 'jpg' : 'jpg'
}
