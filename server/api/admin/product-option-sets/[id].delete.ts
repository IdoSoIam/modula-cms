import { db } from '#modula/server/data/client'
import { requireAdmin } from '#modula/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'ID invalide' })
  const existing = await db.productOptionSet.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Ensemble d’options introuvable' })
  await db.productOptionSet.delete({ where: { id } })
  return { success: true }
})
