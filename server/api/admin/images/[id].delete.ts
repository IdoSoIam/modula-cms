import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'
import { unlink } from 'node:fs/promises'
import { join } from 'node:path'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const img = await prisma.image.findUnique({ where: { id } })
  if (!img) throw createError({ statusCode: 404, statusMessage: 'Image introuvable' })

  try {
    await unlink(join(process.cwd(), 'public', 'uploads', img.filename))
  } catch (e) {
    console.warn('[image delete] file unlink failed:', e)
  }

  await prisma.image.delete({ where: { id } })
  return { ok: true }
})
