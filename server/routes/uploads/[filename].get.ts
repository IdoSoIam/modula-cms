import type { H3Event, EventHandlerRequest } from 'h3'
import { db } from '#modula/server/data/client'
import { getUploadObject } from '#modula/server/utils/uploadStorage'
import {
  createStoredImageVariant,
  findStoredImageVariant,
  normalizeImageVariantSignature
} from '#modula/server/utils/imageVariants'
import { arePersistentImageVariantsEnabled } from '#modula/server/utils/settings'

type OutputFormat = 'image/avif' | 'image/webp' | 'image/png' | 'image/jpeg' | 'image/gif'
type LocalImageTransformResult = {
  body: Uint8Array
  mimeType: OutputFormat
}
type ImageResizerBinding = {
  input: (stream: ReadableStream) => {
    transform: (options: Record<string, unknown>) => any
    output: (options: { format: OutputFormat, quality?: number }) => {
      response: () => Response
    }
  }
}

const passthroughMimeTypes = new Set([
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

async function ensureImageRecord(filename: string, mimeType: string, size: number, uploadedAt: Date | undefined) {
  const existing = await db.image.findFirst({
    where: { filename },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      createdAt: true
    }
  })

  if (existing) {
    return existing
  }

  return await db.image.create({
    data: {
      filename,
      url: `/uploads/${filename}`,
      mimeType,
      size,
      width: null,
      height: null,
      uploadedById: null,
      createdAt: uploadedAt ?? new Date(),
      updatedAt: uploadedAt ?? new Date()
    },
    select: {
      id: true,
      filename: true,
      mimeType: true,
      createdAt: true
    }
  })
}

async function readObjectBytes(body: ReadableStream | Uint8Array | ArrayBuffer | null) {
  if (!body) {
    return null
  }

  if (body instanceof Uint8Array) {
    return body
  }

  if (body instanceof ArrayBuffer) {
    return new Uint8Array(body)
  }

  return new Uint8Array(await new Response(body as BodyInit).arrayBuffer())
}

function resolveLocalResizeFit(fit: string | undefined) {
  switch (fit) {
    case 'contain':
      return 'contain' as const
    case 'crop':
    case 'cover':
      return 'cover' as const
    case 'pad':
      return 'contain' as const
    case 'scale-down':
      return 'inside' as const
    default:
      return undefined
  }
}

async function transformLocally(
  bytes: Uint8Array,
  sourceMimeType: string,
  outputFormat: OutputFormat,
  transform: Record<string, unknown>,
  quality: number | undefined
): Promise<LocalImageTransformResult> {
  const sharpImporter = new Function('return import("sharp")') as () => Promise<{ default: any }>
  const { default: sharp } = await sharpImporter()
  const fit = resolveLocalResizeFit(typeof transform.fit === 'string' ? transform.fit : undefined)
  const width = typeof transform.width === 'number' ? transform.width : undefined
  const height = typeof transform.height === 'number' ? transform.height : undefined
  const instance = sharp(bytes, {
    animated: sourceMimeType === 'image/gif'
  })

  if (width || height) {
    instance.resize({
      width,
      height,
      fit,
      withoutEnlargement: typeof transform.fit === 'string' && transform.fit === 'scale-down',
      background: typeof transform.fit === 'string' && transform.fit === 'pad'
        ? { r: 255, g: 255, b: 255, alpha: 0 }
        : undefined
    })
  }

  switch (outputFormat) {
    case 'image/avif':
      instance.avif(quality ? { quality } : {})
      break
    case 'image/webp':
      instance.webp(quality ? { quality } : {})
      break
    case 'image/png':
      instance.png()
      break
    case 'image/gif':
      instance.gif()
      break
    default:
      instance.jpeg(quality ? { quality } : {})
      break
  }

  return {
    body: new Uint8Array(await instance.toBuffer()),
    mimeType: outputFormat
  }
}

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')

  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Nom de fichier manquant' })
  }

  const object = await getUploadObject(filename)
  if (!object) {
    throw createError({ statusCode: 404, statusMessage: 'Image introuvable dans le stockage' })
  }

  const fallbackMimeType = object.httpMetadata?.contentType || 'application/octet-stream'
  const image = await ensureImageRecord(filename, fallbackMimeType, object.size || 0, object.uploaded)
  const sourceMimeType = object.httpMetadata?.contentType || image.mimeType || 'application/octet-stream'
  const lastModified = object.uploaded || image.createdAt

  const { transform, quality, requestedFormat } = buildTransformOptions(event)
  const shouldTransform = Object.keys(transform).length > 0 || Boolean(requestedFormat)
  const resizer = event.context.cloudflare?.env?.IMAGE_RESIZER as ImageResizerBinding | undefined
  const persistVariants = shouldTransform ? await arePersistentImageVariantsEnabled() : false

  if (shouldTransform && persistVariants) {
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
      return new Response(existingVariant.object.body as BodyInit)
    }
  }

  if (shouldTransform && !passthroughMimeTypes.has(sourceMimeType)) {
    const outputFormat = resolveOutputFormat(getHeader(event, 'accept') || '', requestedFormat, sourceMimeType)
    let transformedBody: Uint8Array | null = null

    if (resizer && object.body instanceof ReadableStream) {
      const response = (
        await resizer
          .input(object.body)
          .transform(transform)
          .output({
            format: outputFormat,
            quality
          })
      ).response()
      transformedBody = new Uint8Array(await response.arrayBuffer())
    } else if (!event.context.cloudflare) {
      const sourceBytes = await readObjectBytes(object.body)
      if (sourceBytes) {
        const transformed = await transformLocally(sourceBytes, sourceMimeType, outputFormat, transform, quality)
        transformedBody = transformed.body
      }
    }

    if (transformedBody) {
      if (!persistVariants) {
        setBaseHeaders(event, outputFormat, lastModified)
        return new Response(transformedBody as unknown as BodyInit)
      }

      const storedVariant = await createStoredImageVariant({
        imageId: image.id,
        originalFilename: image.filename,
        mimeType: outputFormat,
        size: transformedBody.byteLength,
        data: transformedBody,
        signature: {
          width: typeof transform.width === 'number' ? transform.width : undefined,
          height: typeof transform.height === 'number' ? transform.height : undefined,
          fit: typeof transform.fit === 'string' ? transform.fit : undefined,
          quality,
          format: outputFormat
        }
      })

      setBaseHeaders(event, storedVariant.mimeType, storedVariant.createdAt)
      return new Response(transformedBody as unknown as BodyInit)
    }
  }

  setBaseHeaders(event, sourceMimeType, lastModified)
  return new Response(object.body as BodyInit)
})
