import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeBillingDocumentTemplate } from '#modula/server/utils/billingDocuments'
import { getSiteLocales } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const siteLocales = await getSiteLocales()
  const kind = String(getQuery(event).kind || '').trim().toUpperCase()
  const rows = await db.billingDocumentTemplate.findMany({
    where: kind === 'INVOICE' || kind === 'CONTRACT' || kind === 'ASSURANCE' ? { kind } : undefined,
    orderBy: [
      { kind: 'asc' },
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  return rows.map((row: Awaited<typeof rows>[number]) => serializeBillingDocumentTemplate(row, siteLocales))
})
