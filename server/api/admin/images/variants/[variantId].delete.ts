import { db } from '#modula/server/data/client'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { deleteUploadObject } from '#modula/server/utils/uploadStorage'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const variantId = Number(getRouterParam(event, 'variantId'))
  if (!variantId) {
    throw createError({ statusCode: 400, statusMessage: 'ID de variante invalide' })
  }

  const variant = await db.imageVariant.findUnique({
    where: { id: variantId }
  })

  if (!variant) {
    throw createError({ statusCode: 404, statusMessage: 'Variante introuvable' })
  }

  await deleteUploadObject(variant.storageKey)
  await db.imageVariant.delete({
    where: { id: variantId }
  })

  return { ok: true }
})
