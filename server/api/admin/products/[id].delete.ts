import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const product = await db.product.findUnique({ where: { id } })
  if (!product || product.deletedAt) {
    throw createError({ statusCode: 404, message: 'Produit introuvable' })
  }

  await db.product.update({
    where: { id },
    data: {
      active: false,
      catalogVisible: false,
      deletedAt: new Date().toISOString(),
    },
  })
  return { ok: true, archived: true }
})
