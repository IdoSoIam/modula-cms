import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeBillingDocumentTemplate } from '#modula/server/utils/billingDocuments'
import { getSiteLocales } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const siteLocales = await getSiteLocales()
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const row = await db.billingDocumentTemplate.findUnique({ where: { id } })
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable' })
  }

  return serializeBillingDocumentTemplate(row, siteLocales)
})
