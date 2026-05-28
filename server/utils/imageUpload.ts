import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { slugify } from '#modula/server/utils/slug'

export const ALLOWED_IMAGE_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/x-icon',
  'image/vnd.microsoft.icon'
] as const
export const MAX_IMAGE_UPLOAD_SIZE = 20 * 1024 * 1024

type OptimizableMimeType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'

type PreparedImageUpload = {
  buffer: Uint8Array
  mimeType: string
  extension: string
  width: number | null
  height: number | null
  size: number
}

function normalizeExtension(extension: string, mimeType: string) {
  const lowered = extension.toLowerCase()
  if (mimeType === 'image/jpeg') return lowered === '.jpeg' ? '.jpeg' : '.jpg'
  if (mimeType === 'image/png') return '.png'
  if (mimeType === 'image/webp') return '.webp'
  if (mimeType === 'image/avif') return '.avif'
  if (mimeType === 'image/gif') return '.gif'
  if (mimeType === 'image/x-icon' || mimeType === 'image/vnd.microsoft.icon') return '.ico'
  return lowered || `.${mimeType.split('/')[1] || 'bin'}`
}

function isOptimizableMimeType(mimeType: string): mimeType is OptimizableMimeType {
  return mimeType === 'image/jpeg' || mimeType === 'image/png' || mimeType === 'image/webp' || mimeType === 'image/avif'
}

async function loadSharp() {
  try {
    const importer = new Function('specifier', 'return import(specifier)')
    const mod = await importer('sharp') as { default?: any }
    return mod.default ?? mod
  } catch {
    return null
  }
}

export function buildImageFilename(baseName: string, extension: string) {
  const safeBase = slugify(baseName || 'image')
  return `${safeBase}-${randomUUID().slice(0, 8)}${extension}`
}

export async function prepareImageUpload(input: {
  data: Uint8Array
  mimeType: string
  originalFilename?: string | null
}): Promise<PreparedImageUpload> {
  const originalBuffer = input.data
  const originalExtension = extname(input.originalFilename || '')
  const normalizedExtension = normalizeExtension(originalExtension, input.mimeType)

  if (!isOptimizableMimeType(input.mimeType)) {
    return {
      buffer: originalBuffer,
      mimeType: input.mimeType,
      extension: normalizedExtension,
      width: null,
      height: null,
      size: originalBuffer.byteLength
    }
  }

  const sharp = await loadSharp()
  if (!sharp) {
    return {
      buffer: originalBuffer,
      mimeType: input.mimeType,
      extension: normalizedExtension,
      width: null,
      height: null,
      size: originalBuffer.byteLength
    }
  }

  const pipeline = sharp(originalBuffer, { failOn: 'none' }).rotate()
  const metadata = await pipeline.metadata()
  const width = typeof metadata.width === 'number' ? metadata.width : null
  const height = typeof metadata.height === 'number' ? metadata.height : null

  let optimizedBuffer: Buffer
  switch (input.mimeType) {
    case 'image/jpeg':
      optimizedBuffer = await pipeline
        .jpeg({
          quality: 82,
          mozjpeg: true,
          progressive: true
        })
        .toBuffer()
      break
    case 'image/png':
      optimizedBuffer = await pipeline
        .png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          effort: 10,
          palette: true,
          quality: 82
        })
        .toBuffer()
      break
    case 'image/webp':
      optimizedBuffer = await pipeline
        .webp({
          quality: 82,
          effort: 6
        })
        .toBuffer()
      break
    case 'image/avif':
      optimizedBuffer = await pipeline
        .avif({
          quality: 55,
          effort: 7
        })
        .toBuffer()
      break
  }

  const finalBuffer = optimizedBuffer.byteLength <= originalBuffer.byteLength
    ? new Uint8Array(optimizedBuffer)
    : originalBuffer

  return {
    buffer: finalBuffer,
    mimeType: input.mimeType,
    extension: normalizedExtension,
    width,
    height,
    size: finalBuffer.byteLength
  }
}
