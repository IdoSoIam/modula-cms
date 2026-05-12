import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences } from '~/server/utils/imageReferences'
import { deleteUploadObject } from '~/server/utils/uploadStorage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const img = await prisma.image.findUnique({ where: { id } })
  if (!img) throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })
  const references = await countImageReferences(img.url)
  const linkedCount = references.vegetables + references.baskets + references.articles + references.articleContent + references.rootPage.count
  if (linkedCount > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Image encore utilisee, remplacez-la ou retirez les associations avant suppression' })
  }

  await deleteUploadObject(img.filename)
  await prisma.image.delete({ where: { id } })
  return { ok: true }
})
