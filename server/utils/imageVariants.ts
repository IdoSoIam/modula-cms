import { extname } from 'node:path'
import { prisma } from '../../prisma/client'
import { deleteUploadObject, getUploadObject, putUploadObject } from '~/server/utils/uploadStorage'

export type ImageVariantSignature = {
  width?: number
  height?: number
  fit?: string
  quality?: number
  format: string
}

function normalizeInteger(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return undefined
  return Math.round(value)
}

function normalizeOptionalText(value?: string) {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return normalized || undefined
}

export function normalizeImageVariantSignature(signature: ImageVariantSignature): ImageVariantSignature {
  return {
    width: normalizeInteger(signature.width),
    height: normalizeInteger(signature.height),
    fit: normalizeOptionalText(signature.fit),
    quality: normalizeInteger(signature.quality),
    format: normalizeOptionalText(signature.format) || 'image/jpeg'
  }
}

export function mimeTypeToExtension(mimeType: string) {
  switch (mimeType) {
    case 'image/avif':
      return '.avif'
    case 'image/webp':
      return '.webp'
    case 'image/png':
      return '.png'
    case 'image/gif':
      return '.gif'
    case 'image/svg+xml':
      return '.svg'
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return '.ico'
    default:
      return '.jpg'
  }
}

function stripExtension(filename: string) {
  const extension = extname(filename)
  return extension ? filename.slice(0, -extension.length) : filename
}

export function buildImageVariantStorageKey(filename: string, signature: ImageVariantSignature) {
  const normalized = normalizeImageVariantSignature(signature)
  const parts = [
    stripExtension(filename),
    normalized.width ? `w${normalized.width}` : null,
    normalized.height ? `h${normalized.height}` : null,
    normalized.fit ? `fit-${normalized.fit}` : null,
    normalized.quality ? `q${normalized.quality}` : null,
    normalized.format.replace('image/', '')
  ].filter(Boolean)

  return `${parts.join('__')}${mimeTypeToExtension(normalized.format)}`
}

export async function findStoredImageVariant(imageId: number, signature: ImageVariantSignature) {
  const normalized = normalizeImageVariantSignature(signature)
  const variant = await prisma.imageVariant.findFirst({
    where: {
      imageId,
      width: normalized.width ?? null,
      height: normalized.height ?? null,
      fit: normalized.fit ?? null,
      quality: normalized.quality ?? null,
      format: normalized.format
    },
    orderBy: {
      id: 'desc'
    }
  })

  if (!variant) return null

  const object = await getUploadObject(variant.storageKey)
  if (!object) {
    await prisma.imageVariant.delete({ where: { id: variant.id } })
    return null
  }

  return {
    variant,
    object
  }
}

export async function createStoredImageVariant(input: {
  imageId: number
  originalFilename: string
  mimeType: string
  size: number
  data: Uint8Array
  signature: ImageVariantSignature
}) {
  const normalized = normalizeImageVariantSignature(input.signature)
  const storageKey = buildImageVariantStorageKey(input.originalFilename, normalized)

  await putUploadObject(storageKey, input.data, input.mimeType)

  return await prisma.imageVariant.upsert({
    where: { storageKey },
    create: {
      imageId: input.imageId,
      storageKey,
      mimeType: input.mimeType,
      size: input.size,
      width: normalized.width ?? null,
      height: normalized.height ?? null,
      fit: normalized.fit ?? null,
      quality: normalized.quality ?? null,
      format: normalized.format
    },
    update: {
      mimeType: input.mimeType,
      size: input.size,
      width: normalized.width ?? null,
      height: normalized.height ?? null,
      fit: normalized.fit ?? null,
      quality: normalized.quality ?? null,
      format: normalized.format
    }
  })
}

export async function deleteImageVariants(imageId: number) {
  const variants = await prisma.imageVariant.findMany({
    where: { imageId },
    select: { id: true, storageKey: true }
  })

  await Promise.all(variants.map(async (variant) => {
    await deleteUploadObject(variant.storageKey)
  }))

  if (variants.length) {
    await prisma.imageVariant.deleteMany({ where: { imageId } })
  }
}
