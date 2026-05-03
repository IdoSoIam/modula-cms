import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences } from '~/server/utils/imageReferences'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.image.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
  return Promise.all(items.map(async (item) => ({
    ...item,
    references: await countImageReferences(item.url)
  })))
})
