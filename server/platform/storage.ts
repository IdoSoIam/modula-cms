import { copyFile, mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { getCloudflareRuntimeEnv } from '#modula/server/platform/runtime'

export type UploadMetadata = {
  contentType?: string
}

export type UploadObjectRecord = {
  key: string
  size: number
  uploaded?: Date
  httpMetadata?: UploadMetadata
}

export type UploadObjectBody = ReadableStream | Uint8Array | ArrayBuffer | null

export type UploadObjectResult = {
  body: UploadObjectBody
  size: number
  uploaded?: Date
  httpMetadata?: UploadMetadata
  arrayBuffer: () => Promise<ArrayBuffer>
}

export interface UploadStorageAdapter {
  hasBackend(): boolean
  put(key: string, body: Uint8Array, contentType: string): Promise<void>
  get(key: string): Promise<UploadObjectResult | null>
  list(): Promise<UploadObjectRecord[]>
  delete(key: string): Promise<void>
  rename(oldKey: string, newKey: string, contentType: string): Promise<void>
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

function getFilesystemUploadsDir() {
  const config = useRuntimeConfig()
  const runtimeEnvDir = process.env.CMS_FILESYSTEM_STORAGE_DIR?.trim() || process.env.IMAGE_FILESYSTEM_DIR?.trim() || ''
  const relativeDir = runtimeEnvDir
    || (typeof config.cmsFilesystemStorageDir === 'string' && config.cmsFilesystemStorageDir.trim()
      ? config.cmsFilesystemStorageDir.trim()
      : 'public/uploads')

  return resolve(process.cwd(), relativeDir)
}

function getLegacyFilesystemUploadsDirs() {
  const targetDir = getFilesystemUploadsDir()
  const candidates = [
    resolve(process.cwd(), 'public', 'uploads'),
    resolve(process.cwd(), '.output', 'public', 'uploads')
  ]

  return candidates.filter(candidate => candidate !== targetDir)
}

async function hydrateFilesystemUploadsDirFromLegacyLocations(targetDir: string) {
  for (const sourceDir of getLegacyFilesystemUploadsDirs()) {
    try {
      const entries = await readdir(sourceDir, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile()) continue

        const sourcePath = join(sourceDir, entry.name)
        const targetPath = join(targetDir, entry.name)

        try {
          await stat(targetPath)
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
          }

          await copyFile(sourcePath, targetPath)
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
    }
  }
}

let ensureFilesystemUploadsDirPromise: Promise<void> | null = null

async function ensureFilesystemUploadsDir() {
  if (!ensureFilesystemUploadsDirPromise) {
    ensureFilesystemUploadsDirPromise = (async () => {
      const targetDir = getFilesystemUploadsDir()
      await mkdir(targetDir, { recursive: true })
      await hydrateFilesystemUploadsDirFromLegacyLocations(targetDir)
    })().finally(() => {
      ensureFilesystemUploadsDirPromise = null
    })
  }

  await ensureFilesystemUploadsDirPromise
}

function getUploadsBucket() {
  return getCloudflareRuntimeEnv()?.UPLOADS_BUCKET
}

function requireUploadsBucket() {
  const bucket = getUploadsBucket()
  if (!bucket) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stockage objet indisponible dans ce runtime'
    })
  }

  return bucket
}

const filesystemStorageAdapter: UploadStorageAdapter = {
  hasBackend() {
    return true
  },
  async put(key, body) {
    const normalizedKey = normalizeKey(key)
    await ensureFilesystemUploadsDir()
    await writeFile(join(getFilesystemUploadsDir(), normalizedKey), body)
  },
  async get(key) {
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
  },
  async list() {
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
  },
  async delete(key) {
    const normalizedKey = normalizeKey(key)
    await rm(join(getFilesystemUploadsDir(), normalizedKey), { force: true })
  },
  async rename(oldKey, newKey) {
    const normalizedOldKey = normalizeKey(oldKey)
    const normalizedNewKey = normalizeKey(newKey)
    if (normalizedOldKey === normalizedNewKey) return
    await ensureFilesystemUploadsDir()
    await rename(
      join(getFilesystemUploadsDir(), normalizedOldKey),
      join(getFilesystemUploadsDir(), normalizedNewKey)
    )
  }
}

const r2StorageAdapter: UploadStorageAdapter = {
  hasBackend() {
    return Boolean(getUploadsBucket())
  },
  async put(key, body, contentType) {
    const bucket = requireUploadsBucket()
    const normalizedKey = normalizeKey(key)

    await bucket.put(normalizedKey, body, {
      httpMetadata: {
        contentType
      }
    })
  },
  async get(key) {
    const bucket = requireUploadsBucket()
    return await bucket.get(normalizeKey(key))
  },
  async list() {
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
  },
  async delete(key) {
    const bucket = requireUploadsBucket()
    await bucket.delete(normalizeKey(key))
  },
  async rename(oldKey, newKey, contentType) {
    const bucket = requireUploadsBucket()
    const normalizedOldKey = normalizeKey(oldKey)
    const normalizedNewKey = normalizeKey(newKey)

    if (normalizedOldKey === normalizedNewKey) return

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
}

export function getUploadStorageAdapter(): UploadStorageAdapter {
  const config = useRuntimeConfig()
  const runtimeStorageDriver = (process.env.CMS_STORAGE_DRIVER?.trim() || process.env.IMAGE_STORAGE_DRIVER?.trim() || String(config.cmsStorageDriver || '')).toLowerCase()
  if (runtimeStorageDriver === 'fs' || runtimeStorageDriver === 'filesystem' || runtimeStorageDriver === 'local') {
    return filesystemStorageAdapter
  }

  if (runtimeStorageDriver === 'r2') {
    return r2StorageAdapter
  }

  throw createError({
    statusCode: 501,
    statusMessage: `Storage driver "${String(runtimeStorageDriver || config.cmsStorageDriver)}" is not implemented yet`
  })
}
