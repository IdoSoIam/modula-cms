import { getUploadStorageAdapter } from '#modula/server/platform/storage'

export { getUploadStorageAdapter }
export type { UploadMetadata, UploadObjectBody, UploadObjectRecord, UploadObjectResult, UploadStorageAdapter } from '#modula/server/platform/storage'

export function hasUploadsBucket() {
  return getUploadStorageAdapter().hasBackend()
}

export function requireUploadsBucket() {
  if (!hasUploadsBucket()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Stockage des uploads indisponible dans ce runtime'
    })
  }

  return true
}

export async function putUploadObject(key: string, body: Uint8Array, contentType: string) {
  await getUploadStorageAdapter().put(key, body, contentType)
}

export async function getUploadObject(key: string) {
  return await getUploadStorageAdapter().get(key)
}

export async function listUploadObjects() {
  return await getUploadStorageAdapter().list()
}

export async function deleteUploadObject(key: string) {
  await getUploadStorageAdapter().delete(key)
}

export async function renameUploadObject(oldKey: string, newKey: string, contentType: string) {
  await getUploadStorageAdapter().rename(oldKey, newKey, contentType)
}
