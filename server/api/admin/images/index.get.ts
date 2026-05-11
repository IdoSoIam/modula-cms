import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences } from '~/server/utils/imageReferences'
import { listUploadObjects } from '~/server/utils/uploadStorage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const bucketObjects = await listUploadObjects()
  const filenames = bucketObjects.map(object => object.key)

  if (!filenames.length) {
    return []
  }

  const existingRows = await prisma.image.findMany({
    where: { filename: { in: filenames } },
    select: {
      id: true,
      filename: true,
      url: true,
      mimeType: true,
      size: true,
      width: true,
      height: true,
      uploadedById: true,
      createdAt: true
    }
  })

  const existingByFilename = new Map(existingRows.map(row => [row.filename, row]))
  const creates = bucketObjects
    .filter(object => !existingByFilename.has(object.key))
    .map(object => ({
      filename: object.key,
      url: `/uploads/${object.key}`,
      mimeType: object.httpMetadata?.contentType || 'application/octet-stream',
      size: object.size,
      createdAt: object.uploaded ?? new Date()
    }))

  if (creates.length) {
    await prisma.image.createMany({ data: creates })
  }

  await Promise.all(bucketObjects.map(async (object) => {
    const existing = existingByFilename.get(object.key)
    if (!existing) return

    const nextUrl = `/uploads/${object.key}`
    const nextMimeType = object.httpMetadata?.contentType || existing.mimeType || 'application/octet-stream'
    const nextSize = object.size

    if (existing.url === nextUrl && existing.mimeType === nextMimeType && existing.size === nextSize) {
      return
    }

    await prisma.image.update({
      where: { id: existing.id },
      data: {
        url: nextUrl,
        mimeType: nextMimeType,
        size: nextSize
      }
    })
  }))

  const syncedRows = await prisma.image.findMany({
    where: { filename: { in: filenames } },
    select: {
      id: true,
      filename: true,
      url: true,
      mimeType: true,
      size: true,
      width: true,
      height: true,
      uploadedById: true,
      createdAt: true
    }
  })

  const rowByFilename = new Map(syncedRows.map(row => [row.filename, row]))
  const orderedRows = bucketObjects
    .slice()
    .sort((a, b) => (b.uploaded?.getTime() ?? 0) - (a.uploaded?.getTime() ?? 0))
    .map(object => rowByFilename.get(object.key))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))

  return Promise.all(orderedRows.map(async (item) => ({
    ...item,
    references: await countImageReferences(item.url)
  })))
})
