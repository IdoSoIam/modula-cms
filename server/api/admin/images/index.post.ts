import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { putUploadObject } from '~/server/utils/uploadStorage'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
const MAX_SIZE = 8 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Aucun fichier reçu' })

  const filePart = parts.find(p => p.name === 'file' && p.filename)
  if (!filePart || !filePart.data) throw createError({ statusCode: 400, statusMessage: 'Fichier manquant' })

  const mime = filePart.type || 'application/octet-stream'
  if (!ALLOWED.includes(mime)) {
    throw createError({ statusCode: 400, statusMessage: 'Format non supporté (jpg, png, webp, gif, avif)' })
  }
  if (filePart.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Image trop lourde (max 8 Mo)' })
  }

  const ext = (extname(filePart.filename || '').toLowerCase() || '.' + mime.split('/')[1]).slice(0, 6)
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`
  const url = `/uploads/${filename}`
  const fileData = new Uint8Array(filePart.data)
  await putUploadObject(filename, fileData, mime)
  const image = await prisma.image.create({
    data: {
      filename,
      url,
      mimeType: mime,
      size: filePart.data.length,
      uploadedById: user.id
    }
  })
  return image
})
