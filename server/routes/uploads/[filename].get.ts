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
      data: true,
      mimeType: true,
      updatedAt: true
    }
  })

  if (!image?.data) {
    const object = await getUploadObject(filename)
    if (!object) {
      throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })
    }

    setHeader(event, 'Content-Type', object.httpMetadata?.contentType || image?.mimeType || 'application/octet-stream')
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    if (object.uploaded) {
      setHeader(event, 'Last-Modified', object.uploaded.toUTCString())
    }

    return new Response(object.body)
  }

  const object = await getUploadObject(filename)
  if (object) {
    setHeader(event, 'Content-Type', object.httpMetadata?.contentType || image.mimeType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    if (object.uploaded) {
      setHeader(event, 'Last-Modified', object.uploaded.toUTCString())
    }

    return new Response(object.body)
  }

  setHeader(event, 'Content-Type', image.mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Last-Modified', image.updatedAt.toUTCString())

  return new Response(image.data)
})
