import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { putUploadObject } from '#modula/server/utils/uploadStorage'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import {
  ALLOWED_IMAGE_UPLOAD_MIME_TYPES,
  MAX_IMAGE_UPLOAD_SIZE,
  buildImageFilename,
  prepareImageUpload
} from '#modula/server/utils/imageUpload'

export default defineEventHandler(async (event) => {
  const user = await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'Aucun fichier recu' })

  const filePart = parts.find(p => p.name === 'file' && p.filename)
  if (!filePart || !filePart.data) throw createError({ statusCode: 400, statusMessage: 'Fichier manquant' })

  const mime = filePart.type || 'application/octet-stream'
  if (!ALLOWED_IMAGE_UPLOAD_MIME_TYPES.includes(mime as (typeof ALLOWED_IMAGE_UPLOAD_MIME_TYPES)[number])) {
    throw createError({ statusCode: 400, statusMessage: 'Format non supporte (jpg, png, webp, gif, avif, ico)' })
  }

  if (filePart.data.length > MAX_IMAGE_UPLOAD_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Image trop lourde (max 20 Mo)' })
  }

  const prepared = await prepareImageUpload({
    data: new Uint8Array(filePart.data),
    mimeType: mime,
    originalFilename: filePart.filename
  })

  const originalBaseName = (filePart.filename || 'image').replace(/\.[^.]+$/, '')
  const filename = buildImageFilename(originalBaseName, prepared.extension)
  const url = `/uploads/${filename}`

  await putUploadObject(filename, prepared.buffer, prepared.mimeType)

  const created = await prisma.image.create({
    data: {
      filename,
      url,
      mimeType: prepared.mimeType,
      size: prepared.size,
      width: prepared.width,
      height: prepared.height,
      uploadedById: user.id
    }
  })

  await syncImageUsageTable()
  return created
})
