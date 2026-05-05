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

export async function putUploadObject(key: string, body: Uint8Array, contentType: string) {
  const bucket = getUploadsBucket()
  if (!bucket) return false

  await bucket.put(key, body, {
    httpMetadata: {
      contentType
    }
  })

  return true
}

export async function getUploadObject(key: string) {
  const bucket = getUploadsBucket()
  if (!bucket) return null
  return await bucket.get(key)
}

export async function deleteUploadObject(key: string) {
  const bucket = getUploadsBucket()
  if (!bucket) return false
  await bucket.delete(key)
  return true
}

export async function renameUploadObject(oldKey: string, newKey: string, contentType: string) {
  const bucket = getUploadsBucket()
  if (!bucket || oldKey === newKey) return false

  const existing = await bucket.get(oldKey)
  if (!existing) return false

  const body = await existing.arrayBuffer()
  await bucket.put(newKey, body, {
    httpMetadata: {
      contentType
    }
  })
  await bucket.delete(oldKey)
  return true
}
