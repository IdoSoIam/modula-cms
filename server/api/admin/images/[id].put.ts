import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { updateImageReferences } from '~/server/utils/imageReferences'
import { slugify } from '~/server/utils/slug'
import { mkdir, rename, unlink, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE = 8 * 1024 * 1024

function buildFilename(baseName: string, ext: string) {
  const safeBase = slugify(baseName || 'image')
  return `${safeBase}-${randomUUID().slice(0, 8)}${ext}`
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const image = await prisma.image.findUnique({ where: { id } })
  if (!image) throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })

  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Aucune donnee recue' })

  const filenamePart = parts.find(p => p.name === 'filename')
  const nextBaseName = (filenamePart?.data ? Buffer.from(filenamePart.data).toString('utf8').trim() : '') || image.filename.replace(/\.[^.]+$/, '')
  const filePart = parts.find(p => p.name === 'file' && p.filename)

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }

  const currentPath = join(UPLOAD_DIR, image.filename)
  let nextFilename = image.filename
  let nextUrl = image.url
  let nextMimeType = image.mimeType
  let nextSize = image.size

  if (filePart?.data) {
    const mime = filePart.type || 'application/octet-stream'
    if (!ALLOWED.includes(mime)) {
      throw createError({ statusCode: 400, statusMessage: 'Format non supporte (jpg, png, webp, gif, avif)' })
    }
    if (filePart.data.length > MAX_SIZE) {
      throw createError({ statusCode: 400, statusMessage: 'Image trop lourde (max 8 Mo)' })
    }

    const ext = (extname(filePart.filename || '').toLowerCase() || `.${mime.split('/')[1]}`).slice(0, 8)
    nextFilename = buildFilename(nextBaseName, ext)
    nextUrl = `/uploads/${nextFilename}`
    nextMimeType = mime
    nextSize = filePart.data.length

    await writeFile(join(UPLOAD_DIR, nextFilename), filePart.data)
    try {
      await unlink(currentPath)
    } catch (error) {
      console.warn('[image update] old file unlink failed:', error)
    }
  } else if (nextBaseName !== image.filename.replace(/\.[^.]+$/, '')) {
    const ext = extname(image.filename)
    nextFilename = buildFilename(nextBaseName, ext)
    nextUrl = `/uploads/${nextFilename}`
    await rename(currentPath, join(UPLOAD_DIR, nextFilename))
  }

  if (nextUrl !== image.url) {
    await updateImageReferences(image.url, nextUrl)
  }

  return prisma.image.update({
    where: { id },
    data: {
      filename: nextFilename,
      url: nextUrl,
      mimeType: nextMimeType,
      size: nextSize
    }
  })
})
