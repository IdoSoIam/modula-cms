import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'

interface CloudflareStorageEnv {
  UPLOADS_BUCKET?: R2Bucket
}

type UploadStorageDriver = 'r2' | 'filesystem'

type UploadMetadata = {
  contentType?: string
}

type UploadObjectRecord = {
  key: string
  size: number
  uploaded?: Date
  httpMetadata?: UploadMetadata
}

type UploadObjectBody = ReadableStream | Uint8Array | ArrayBuffer | null

type UploadObjectResult = {
  body: UploadObjectBody
  size: number
  uploaded?: Date
  httpMetadata?: UploadMetadata
  arrayBuffer: () => Promise<ArrayBuffer>
}

function getCloudflareEnv(): CloudflareStorageEnv | undefined {
  return (globalThis as { __env__?: CloudflareStorageEnv }).__env__
}

function getUploadsBucket() {
  return getCloudflareEnv()?.UPLOADS_BUCKET
}

function getStorageDriver(): UploadStorageDriver {
  const config = useRuntimeConfig()
  return config.imageStorageDriver === 'filesystem' ? 'filesystem' : 'r2'
}

function getFilesystemUploadsDir() {
  const config = useRuntimeConfig()
  const relativeDir = typeof config.imageFilesystemDir === 'string' && config.imageFilesystemDir.trim()
    ? config.imageFilesystemDir.trim()
    : 'public/uploads'

  return resolve(process.cwd(), relativeDir)
}

function normalizeKey(key: string) {
  const safeKey = basename(key)
  if (!safeKey || safeKey !== key) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Nom de fichier invalide'
    })
  }

  return safeKey
}

function guessContentTypeFromFilename(filename: string) {
  switch (extname(filename).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.webp':
      return 'image/webp'
    case '.gif':
      return 'image/gif'
    case '.avif':
      return 'image/avif'
    case '.svg':
      return 'image/svg+xml'
    case '.ico':
      return 'image/x-icon'
    default:
      return 'application/octet-stream'
  }
}

async function ensureFilesystemUploadsDir() {
  await mkdir(getFilesystemUploadsDir(), { recursive: true })
}

async function putFilesystemUploadObject(key: string, body: Uint8Array) {
  const normalizedKey = normalizeKey(key)
  await ensureFilesystemUploadsDir()
  await writeFile(join(getFilesystemUploadsDir(), normalizedKey), body)
}

async function getFilesystemUploadObject(key: string): Promise<UploadObjectResult | null> {
  const normalizedKey = normalizeKey(key)
  const filePath = join(getFilesystemUploadsDir(), normalizedKey)

  try {
    const [buffer, fileStat] = await Promise.all([readFile(filePath), stat(filePath)])
    const uint8 = new Uint8Array(buffer)

    return {
      body: uint8,
      size: fileStat.size,
      uploaded: fileStat.mtime,
      httpMetadata: {
        contentType: guessContentTypeFromFilename(normalizedKey)
      },
      arrayBuffer: async () => uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }

    throw error
  }
}

async function listFilesystemUploadObjects(): Promise<UploadObjectRecord[]> {
  await ensureFilesystemUploadsDir()
  const entries = await readdir(getFilesystemUploadsDir(), { withFileTypes: true })
  const files = entries.filter((entry) => entry.isFile())

  return Promise.all(files.map(async (entry) => {
    const fileStat = await stat(join(getFilesystemUploadsDir(), entry.name))
    return {
      key: entry.name,
      size: fileStat.size,
      uploaded: fileStat.mtime,
      httpMetadata: {
        contentType: guessContentTypeFromFilename(entry.name)
      }
    }
  }))
}

async function deleteFilesystemUploadObject(key: string) {
  const normalizedKey = normalizeKey(key)
  await rm(join(getFilesystemUploadsDir(), normalizedKey), { force: true })
}

async function renameFilesystemUploadObject(oldKey: string, newKey: string) {
  const normalizedOldKey = normalizeKey(oldKey)
  const normalizedNewKey = normalizeKey(newKey)

  if (normalizedOldKey === normalizedNewKey) return

  await ensureFilesystemUploadsDir()
  await rename(
    join(getFilesystemUploadsDir(), normalizedOldKey),
    join(getFilesystemUploadsDir(), normalizedNewKey)
  )
}

export function hasUploadsBucket() {
  if (getStorageDriver() === 'filesystem') {
    return true
  }

  return Boolean(getUploadsBucket())
}

export function requireUploadsBucket() {
  const bucket = getUploadsBucket()
  if (!bucket) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Bucket R2 UPLOADS_BUCKET indisponible dans ce runtime'
    })
  }

  return bucket
}

export async function putUploadObject(key: string, body: Uint8Array, contentType: string) {
  if (getStorageDriver() === 'filesystem') {
    await putFilesystemUploadObject(key, body)
    return
  }

  const bucket = requireUploadsBucket()
  const normalizedKey = normalizeKey(key)

  await bucket.put(normalizedKey, body, {
    httpMetadata: {
      contentType
    }
  })
}

export async function getUploadObject(key: string): Promise<UploadObjectResult | null> {
  if (getStorageDriver() === 'filesystem') {
    return await getFilesystemUploadObject(key)
  }

  const bucket = requireUploadsBucket()
  return await bucket.get(normalizeKey(key))
}

export async function listUploadObjects(): Promise<UploadObjectRecord[]> {
  if (getStorageDriver() === 'filesystem') {
    return await listFilesystemUploadObjects()
  }

  const bucket = requireUploadsBucket()
  const objects: UploadObjectRecord[] = []

  let cursor: string | undefined
  do {
    const result = await bucket.list({ cursor })
    for (const object of result.objects) {
      const head = await bucket.head(object.key)
      objects.push({
        key: object.key,
        size: object.size,
        uploaded: object.uploaded,
        httpMetadata: head?.httpMetadata ? { contentType: head.httpMetadata.contentType } : undefined
      })
    }
    cursor = result.truncated ? result.cursor : undefined
  } while (cursor)

  return objects
}

export async function deleteUploadObject(key: string) {
  if (getStorageDriver() === 'filesystem') {
    await deleteFilesystemUploadObject(key)
    return
  }

  const bucket = requireUploadsBucket()
  await bucket.delete(normalizeKey(key))
}

export async function renameUploadObject(oldKey: string, newKey: string, contentType: string) {
  const normalizedOldKey = normalizeKey(oldKey)
  const normalizedNewKey = normalizeKey(newKey)

  if (normalizedOldKey === normalizedNewKey) return

  if (getStorageDriver() === 'filesystem') {
    await renameFilesystemUploadObject(normalizedOldKey, normalizedNewKey)
    return
  }

  const bucket = requireUploadsBucket()
  const existing = await bucket.get(normalizedOldKey)
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image source introuvable dans le stockage'
    })
  }

  const body = await existing.arrayBuffer()
  await bucket.put(normalizedNewKey, body, {
    httpMetadata: {
      contentType
    }
  })
  await bucket.delete(normalizedOldKey)
}
