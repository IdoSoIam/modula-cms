import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { countImageReferences } from '~/server/utils/imageReferences'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const img = await prisma.image.findUnique({ where: { id } })
  if (!img) throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })
  const references = await countImageReferences(img.url)
  const linkedCount = references.vegetables + references.baskets + references.articles + references.articleContent
  if (linkedCount > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Image encore utilisee, remplacez-la ou retirez les associations avant suppression' })
  }

  try {
    await unlink(join(process.cwd(), 'public', 'uploads', img.filename))
  } catch (e) {
    console.warn('[image delete] file unlink failed:', e)
  }

  await prisma.image.delete({ where: { id } })
  return { ok: true }
})
