import type { H3Event, EventHandlerRequest } from 'h3'
import { prisma } from '../../../prisma/client'
import { getUploadObject } from '~/server/utils/uploadStorage'
import {
  createStoredImageVariant,
  findStoredImageVariant,
  normalizeImageVariantSignature
} from '~/server/utils/imageVariants'

type OutputFormat = 'image/avif' | 'image/webp' | 'image/png' | 'image/jpeg' | 'image/gif'
type ImageResizerBinding = {
  input: (stream: ReadableStream) => {
    transform: (options: Record<string, unknown>) => any
    output: (options: { format: OutputFormat, quality?: number }) => {
      response: () => Response
    }
  }
}

const passthroughMimeTypes = new Set([
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon'
])

const supportedFits = new Set(['cover', 'contain', 'crop', 'pad', 'scale-down'])

function parsePositiveInteger(value: string | undefined) {
  if (!value) return undefined

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined
  }

  return parsed
}

function parseQuality(value: string | undefined) {
  const parsed = parsePositiveInteger(value)
  if (!parsed) return undefined

  return Math.min(100, Math.max(1, parsed))
}

function normalizeRequestedFormat(value: string | undefined) {
  switch ((value || '').trim().toLowerCase()) {
    case 'avif':
    case 'image/avif':
      return 'image/avif' as const
    case 'webp':
    case 'image/webp':
      return 'image/webp' as const
    case 'png':
    case 'image/png':
      return 'image/png' as const
    case 'jpg':
    case 'jpeg':
    case 'image/jpeg':
      return 'image/jpeg' as const
    case 'gif':
    case 'image/gif':
      return 'image/gif' as const
    default:
      return undefined
  }
}

function resolveOutputFormat(acceptHeader: string, requestedFormat: string | undefined, sourceMimeType: string): OutputFormat {
  const explicit = normalizeRequestedFormat(requestedFormat)
  if (explicit) {
    return explicit
  }

  if (acceptHeader.includes('image/avif')) {
    return 'image/avif'
  }

  if (acceptHeader.includes('image/webp')) {
    return 'image/webp'
  }

  switch (sourceMimeType) {
    case 'image/png':
    case 'image/gif':
    case 'image/webp':
    case 'image/avif':
    case 'image/jpeg':
      return sourceMimeType
    default:
      return 'image/jpeg'
  }
}

function buildTransformOptions(event: H3Event<EventHandlerRequest>) {
  const query = getQuery(event)
  const width = parsePositiveInteger(typeof query.w === 'string' ? query.w : typeof query.width === 'string' ? query.width : undefined)
  const height = parsePositiveInteger(typeof query.h === 'string' ? query.h : typeof query.height === 'string' ? query.height : undefined)
  const quality = parseQuality(typeof query.q === 'string' ? query.q : typeof query.quality === 'string' ? query.quality : undefined)
  const fitCandidate = typeof query.fit === 'string' ? query.fit.trim().toLowerCase() : ''

  const transform: Record<string, unknown> = {}
  if (width) transform.width = width
  if (height) transform.height = height
  if (quality) transform.quality = quality
  if (supportedFits.has(fitCandidate)) {
    transform.fit = fitCandidate
  }

  return {
    transform,
    quality,
    requestedFormat: typeof query.format === 'string' ? query.format : undefined
  }
}

function setBaseHeaders(event: H3Event<EventHandlerRequest>, mimeType: string, lastModified: Date) {
  setHeader(event, 'Content-Type', mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Last-Modified', lastModified.toUTCString())
  setHeader(event, 'Vary', 'Accept')
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')

  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Nom de fichier manquant' })
  }

  const image = await prisma.image.findFirst({
    where: { filename },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      createdAt: true
    }
  })

  if (!image) {
    throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })
  }

  const object = await getUploadObject(filename)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Image introuvable dans le stockage' })
  }

  const sourceMimeType = object.httpMetadata?.contentType || image.mimeType || 'application/octet-stream'
  const lastModified = object.uploaded || image.createdAt

  const { transform, quality, requestedFormat } = buildTransformOptions(event)
  const shouldTransform = Object.keys(transform).length > 0 || Boolean(requestedFormat)
  const resizer = event.context.cloudflare?.env?.IMAGE_RESIZER as ImageResizerBinding | undefined

  if (shouldTransform) {
    const outputFormat = resolveOutputFormat(getHeader(event, 'accept') || '', requestedFormat, sourceMimeType)
    const signature = normalizeImageVariantSignature({
      width: typeof transform.width === 'number' ? transform.width : undefined,
      height: typeof transform.height === 'number' ? transform.height : undefined,
      fit: typeof transform.fit === 'string' ? transform.fit : undefined,
      quality,
      format: outputFormat
    })
    const existingVariant = await findStoredImageVariant(image.id, signature)

    if (existingVariant) {
      setBaseHeaders(event, existingVariant.variant.mimeType, existingVariant.variant.createdAt)
      return new Response(existingVariant.object.body)
    }
  }

  if (
    shouldTransform
    && resizer
    && !passthroughMimeTypes.has(sourceMimeType)
    && object.body instanceof ReadableStream
  ) {
    const outputFormat = resolveOutputFormat(getHeader(event, 'accept') || '', requestedFormat, sourceMimeType)
    const response = (
      await resizer
        .input(object.body)
        .transform(transform)
        .output({
          format: outputFormat,
          quality
        })
    ).response()

    const arrayBuffer = await response.arrayBuffer()
    const body = new Uint8Array(arrayBuffer)
    const storedVariant = await createStoredImageVariant({
      imageId: image.id,
      originalFilename: image.filename,
      mimeType: outputFormat,
      size: body.byteLength,
      data: body,
      signature: {
        width: typeof transform.width === 'number' ? transform.width : undefined,
        height: typeof transform.height === 'number' ? transform.height : undefined,
        fit: typeof transform.fit === 'string' ? transform.fit : undefined,
        quality,
        format: outputFormat
      }
    })

    setBaseHeaders(event, storedVariant.mimeType, storedVariant.createdAt)
    return new Response(body)
  }

  setBaseHeaders(event, sourceMimeType, lastModified)
  return new Response(object.body)
})
