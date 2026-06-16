import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { countImageReferences, listImageUsageAssociations, syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { isRuntimeD1Active, listRuntimeImageVariants, listRuntimeImages } from '#modula/server/platform/runtimeDb'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await syncImageUsageTable()

  if (isRuntimeD1Active()) {
    const images = await listRuntimeImages()
    return await Promise.all(images.map(async (item) => {
      const [usages, references, variants] = await Promise.all([
        listImageUsageAssociations(item.id),
        countImageReferences(item.url),
        listRuntimeImageVariants(item.id)
      ])

      return {
        id: item.id,
        filename: item.filename,
        url: item.url,
        mimeType: item.mimeType,
        size: item.size,
        width: item.width,
        height: item.height,
        uploadedById: item.uploadedById,
        createdAt: item.createdAt,
        variants: variants.map((variant) => ({
          ...variant,
          usages,
          references
        })),
        usages,
        references
      }
    }))
  }

  const images = await db.image.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          storageKey: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          fit: true,
          quality: true,
          format: true,
          createdAt: true
        }
      }
    }
  })

  return await Promise.all(images.map(async (item) => {
    const usages = await listImageUsageAssociations(item.id)
    const references = await countImageReferences(item.url)

    return {
      id: item.id,
      filename: item.filename,
      url: item.url,
      mimeType: item.mimeType,
      size: item.size,
      width: item.width,
      height: item.height,
      uploadedById: item.uploadedById,
      createdAt: item.createdAt,
      variants: item.variants?.map((variant: any) => ({
        ...variant,
        usages,
        references
      })),
      usages,
      references
    }
  }))
})
