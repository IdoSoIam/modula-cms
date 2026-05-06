import { prisma } from '../../../prisma/client'
import { getUploadObject } from '~/server/utils/uploadStorage'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')

  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Nom de fichier manquant' })
  }

  const image = await prisma.image.findFirst({
    where: { filename },
    select: {
      mimeType: true,
      createdAt: true
    }
  })

  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })
  }

  const object = await getUploadObject(filename)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Image introuvable dans R2' })
  }

  setHeader(event, 'Content-Type', object.httpMetadata?.contentType || image.mimeType || 'application/octet-stream')
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Last-Modified', (object.uploaded || image.createdAt).toUTCString())

  return new Response(object.body)
})
