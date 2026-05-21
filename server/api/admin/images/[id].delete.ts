import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences, removeImageReferences, syncImageUsageTable } from '~/server/utils/imageReferences'
import { deleteUploadObject } from '~/server/utils/uploadStorage'
import { deleteImageVariants } from '~/server/utils/imageVariants'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const force = getQuery(event).force === '1'
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const img = await prisma.image.findUnique({ where: { id } })
  if (!img) throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })
  await syncImageUsageTable()
  const references = await countImageReferences(img.url)
  const linkedCount = references.vegetables + references.baskets + references.articles + references.articleContent + references.rootPage.count
  if (linkedCount > 0 && !force) {
    throw createError({ statusCode: 409, statusMessage: 'Image encore utilisee, remplacez-la ou retirez les associations avant suppression' })
  }

  if (linkedCount > 0) {
    await removeImageReferences(img.url)
  }

  await deleteImageVariants(img.id)
  await deleteUploadObject(img.filename)
  await prisma.image.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
