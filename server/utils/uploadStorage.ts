interface CloudflareStorageEnv {
  IMAGES?: R2Bucket
}

function getCloudflareEnv(): CloudflareStorageEnv | undefined {
  return (globalThis as { __env__?: CloudflareStorageEnv }).__env__
}

function getUploadsBucket() {
  return getCloudflareEnv()?.IMAGES
}

export function hasUploadsBucket() {
  return Boolean(getUploadsBucket())
}

export function requireUploadsBucket() {
  const bucket = getUploadsBucket()
  if (!bucket) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Bucket R2 IMAGES indisponible dans ce runtime'
    })
  }

  return bucket
}

export async function putUploadObject(key: string, body: Uint8Array, contentType: string) {
  const bucket = requireUploadsBucket()

  await bucket.put(key, body, {
    httpMetadata: {
      contentType
    }
  })
}

export async function getUploadObject(key: string) {
  const bucket = requireUploadsBucket()
  return await bucket.get(key)
}

export async function deleteUploadObject(key: string) {
  const bucket = requireUploadsBucket()
  await bucket.delete(key)
}

export async function renameUploadObject(oldKey: string, newKey: string, contentType: string) {
  if (oldKey === newKey) return

  const bucket = requireUploadsBucket()

  const existing = await bucket.get(oldKey)
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Image source introuvable dans R2'
    })
  }

  const body = await existing.arrayBuffer()
  await bucket.put(newKey, body, {
    httpMetadata: {
      contentType
    }
  })
  await bucket.delete(oldKey)
}
