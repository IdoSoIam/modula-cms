import { requireAdmin } from '~/server/utils/requireAdmin'
import { syncImageUsageTable } from '~/server/utils/imageReferences'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  await prisma.article.delete({ where: { id } })
  await syncImageUsageTable()
  return { ok: true }
})
