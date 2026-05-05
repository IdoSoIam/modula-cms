import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences } from '~/server/utils/imageReferences'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.image.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
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
  return Promise.all(items.map(async (item) => ({
    ...item,
    references: await countImageReferences(item.url)
  })))
})
