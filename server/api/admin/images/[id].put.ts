import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { updateImageReferences } from '~/server/utils/imageReferences'
import { slugify } from '~/server/utils/slug'
import { extname } from 'node:path'
import { putUploadObject, renameUploadObject, deleteUploadObject } from '~/server/utils/uploadStorage'
import {
  ALLOWED_IMAGE_UPLOAD_MIME_TYPES,
  MAX_IMAGE_UPLOAD_SIZE,
  buildImageFilename,
  prepareImageUpload
} from '~/server/utils/imageUpload'

function buildRenamedFilename(baseName: string, currentExtension: string) {
  const safeBase = slugify(baseName || 'image')
  return buildImageFilename(safeBase, currentExtension)
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

  let nextFilename = image.filename
  let nextUrl = image.url
  let nextMimeType = image.mimeType
  let nextSize = image.size
  let nextWidth = image.width
  let nextHeight = image.height

  if (filePart?.data) {
    const mime = filePart.type || 'application/octet-stream'
    if (!ALLOWED_IMAGE_UPLOAD_MIME_TYPES.includes(mime as (typeof ALLOWED_IMAGE_UPLOAD_MIME_TYPES)[number])) {
      throw createError({ statusCode: 400, statusMessage: 'Format non supporte (jpg, png, webp, gif, avif)' })
    }
    if (filePart.data.length > MAX_IMAGE_UPLOAD_SIZE) {
      throw createError({ statusCode: 400, statusMessage: 'Image trop lourde (max 20 Mo)' })
    }

    const prepared = await prepareImageUpload({
      data: new Uint8Array(filePart.data),
      mimeType: mime,
      originalFilename: filePart.filename
    })

    nextFilename = buildImageFilename(nextBaseName, prepared.extension)
    nextUrl = `/uploads/${nextFilename}`
    nextMimeType = prepared.mimeType
    nextSize = prepared.size
    nextWidth = prepared.width
    nextHeight = prepared.height

    await putUploadObject(nextFilename, prepared.buffer, prepared.mimeType)
    if (image.filename !== nextFilename) {
      await deleteUploadObject(image.filename)
    }
  } else if (nextBaseName !== image.filename.replace(/\.[^.]+$/, '')) {
    const extension = extname(image.filename)
    nextFilename = buildRenamedFilename(nextBaseName, extension)
    nextUrl = `/uploads/${nextFilename}`
    await renameUploadObject(image.filename, nextFilename, image.mimeType)
  }

  if (nextUrl !== image.url) {
    await updateImageReferences(image.url, nextUrl)
  }

  return await prisma.image.update({
    where: { id },
    data: {
      filename: nextFilename,
      url: nextUrl,
      mimeType: nextMimeType,
      size: nextSize,
      width: nextWidth,
      height: nextHeight
    }
  })
})
