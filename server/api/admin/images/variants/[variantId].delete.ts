import { prisma } from '../../../../../prisma/client'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { deleteUploadObject } from '~/server/utils/uploadStorage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const variantId = Number(getRouterParam(event, 'variantId'))
  if (!variantId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de variante invalide' })
  }

  const variant = await prisma.imageVariant.findUnique({
    where: { id: variantId }
  })

  if (!variant) {
    throw createError({ statusCode: 404, statusMessage: 'Variante introuvable' })
  }

  await deleteUploadObject(variant.storageKey)
  await prisma.imageVariant.delete({
    where: { id: variantId }
  })

  return { ok: true }
})
