import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, message: 'ID invalide' })

  const product = await db.product.findUnique({ where: { id } })
  if (!product || !product.deletedAt) {
    throw createError({ statusCode: 404, message: 'Produit archivé introuvable' })
  }

  await db.product.update({
    where: { id },
    data: {
      active: true,
      catalogVisible: true,
      deletedAt: null,
    },
  })

  return { ok: true, restored: true }
})
