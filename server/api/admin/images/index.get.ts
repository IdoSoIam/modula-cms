import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences, listImageUsageAssociations, syncImageUsageTable } from '#modula/server/utils/imageReferences'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await syncImageUsageTable()

  const images = await prisma.image.findMany({
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
      variants: item.variants.map((variant) => ({
        ...variant,
        usages,
        references
      })),
      usages,
      references
    }
  }))
})
