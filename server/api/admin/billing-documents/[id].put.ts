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

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const existing = await db.billingDocumentTemplate.findUnique({ where: { id } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable' })
  }

  const body = await readBody<Body>(event)
  const nextKind = body.kind === 'INVOICE' || body.kind === 'CONTRACT' || body.kind === 'ASSURANCE'
    ? body.kind
    : (existing.kind as BillingDocumentKind)
  const nextName = body.name === undefined ? String(existing.name) : String(body.name || '').trim()
  if (!nextName) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const data: Record<string, any> = {
    kind: nextKind
  }

  if (body.name !== undefined) data.name = nextName
  if (body.description !== undefined) data.description = body.description?.trim() || null
  if (body.brandName !== undefined) data.brandName = body.brandName?.trim() || null
  if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl?.trim() || null
  if (body.accentColor !== undefined) data.accentColor = body.accentColor?.trim() || null
  if (body.sourcePdfUrl !== undefined) data.sourcePdfUrl = body.sourcePdfUrl?.trim() || null
  if (body.active !== undefined) data.active = Boolean(body.active)
  if (body.isDefault !== undefined) data.isDefault = Boolean(body.isDefault)
  if (body.position !== undefined) data.position = Number.isFinite(Number(body.position)) ? Number(body.position) : 0
  if (body.slug !== undefined || body.name !== undefined) {
    data.slug = await ensureUniqueBillingDocumentSlug(body.slug?.trim() || nextName || String(existing.slug), id)
  }
  if (body.titleLocalized !== undefined) {
    data.titleJson = buildBillingDocumentLocalizedPayload(body.titleLocalized, nextName).json
  }
  if (body.contentLocalized !== undefined) {
    data.contentJson = buildBillingDocumentLocalizedPayload(body.contentLocalized).json
  }
  if (body.footerLocalized !== undefined) {
    data.footerJson = buildBillingDocumentLocalizedPayload(body.footerLocalized).json
  }
  if (body.invoiceColumns !== undefined) {
    data.invoiceColumnsJson = JSON.stringify(normalizeBillingDocumentInvoiceColumns(body.invoiceColumns))
  }

  const row = await db.billingDocumentTemplate.update({
    where: { id },
    data
  })

  if (row.isDefault) {
    await enforceSingleDefaultBillingDocument(nextKind, Number(row.id))
  }

  const saved = await db.billingDocumentTemplate.findUnique({ where: { id } })
  return serializeBillingDocumentTemplate(saved)
})
