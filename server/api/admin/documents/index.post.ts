import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { putUploadObject } from '#modula/server/utils/uploadStorage'
import { buildImageFilename } from '#modula/server/utils/imageUpload'

const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
] as const

const MAX_DOCUMENT_UPLOAD_SIZE = 25 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const parts = await readMultipartFormData(event)
  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun fichier recu' })
  }

  const filePart = parts.find((part) => part.name === 'file' && part.filename)
  if (!filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'Fichier manquant' })
  }

  const mimeType = filePart.type || 'application/octet-stream'
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
    throw createError({ statusCode: 400, statusMessage: 'Seuls les PDF sont supportes ici' })
  }

  if (filePart.data.length > MAX_DOCUMENT_UPLOAD_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Document trop lourd (max 25 Mo)' })
  }

  const baseName = (filePart.filename || 'document').replace(/\.[^.]+$/, '')
  const filename = buildImageFilename(baseName, '.pdf')
  await putUploadObject(filename, new Uint8Array(filePart.data), mimeType)

  return {
    filename,
    url: `/uploads/${filename}`,
    mimeType,
    size: filePart.data.length,
  }
})
