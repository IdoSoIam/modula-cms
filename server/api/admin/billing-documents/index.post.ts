import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import {
  buildBillingDocumentLocalizedPayload,
  normalizeBillingDocumentInvoiceColumns,
  enforceSingleDefaultBillingDocument,
  ensureUniqueBillingDocumentSlug,
  serializeBillingDocumentTemplate,
  type BillingDocumentInvoiceColumnConfig,
  type BillingDocumentKind,
} from '#modula/server/utils/billingDocuments'
import type { CmsLocalizedText } from '#modula/shared/cms'

interface Body {
  kind?: BillingDocumentKind
  slug?: string
  name?: string
  description?: string | null
  brandName?: string | null
  logoUrl?: string | null
  accentColor?: string | null
  sourcePdfUrl?: string | null
  titleLocalized?: CmsLocalizedText | null
  contentLocalized?: CmsLocalizedText | null
  footerLocalized?: CmsLocalizedText | null
  invoiceColumns?: BillingDocumentInvoiceColumnConfig[] | null
  active?: boolean
  isDefault?: boolean
  position?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<Body>(event)
  const kind = body.kind === 'INVOICE'
    ? 'INVOICE'
    : body.kind === 'ASSURANCE'
      ? 'ASSURANCE'
      : 'CONTRACT'
  const name = String(body.name || '').trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const titlePayload = buildBillingDocumentLocalizedPayload(body.titleLocalized, name)
  const contentPayload = buildBillingDocumentLocalizedPayload(body.contentLocalized)
  const footerPayload = buildBillingDocumentLocalizedPayload(body.footerLocalized)
  const invoiceColumns = normalizeBillingDocumentInvoiceColumns(body.invoiceColumns)
  const slug = await ensureUniqueBillingDocumentSlug(body.slug?.trim() || name)

  const row = await db.billingDocumentTemplate.create({
    data: {
      kind,
      slug,
      name,
      description: body.description?.trim() || null,
      brandName: body.brandName?.trim() || null,
      logoUrl: body.logoUrl?.trim() || null,
      accentColor: body.accentColor?.trim() || null,
      sourcePdfUrl: body.sourcePdfUrl?.trim() || null,
      titleJson: titlePayload.json,
      contentJson: contentPayload.json,
      footerJson: footerPayload.json,
      invoiceColumnsJson: JSON.stringify(invoiceColumns),
      active: body.active !== false,
      isDefault: Boolean(body.isDefault),
      position: Number.isFinite(Number(body.position)) ? Number(body.position) : 0
    }
  })

  if (row.isDefault) {
    await enforceSingleDefaultBillingDocument(kind, Number(row.id))
  }

  const saved = await db.billingDocumentTemplate.findUnique({ where: { id: Number(row.id) } })
  return serializeBillingDocumentTemplate(saved)
})
