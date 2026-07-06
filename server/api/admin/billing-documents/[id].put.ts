import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { getSiteLocales } from '#modula/server/utils/settings'
import {
  buildBillingDocumentLocalizedPayload,
  normalizeBillingDocumentInvoiceOptions,
  sanitizeBillingDocumentInvoiceColumns,
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
  invoiceOptions?: Record<string, unknown> | null
  active?: boolean
  isDefault?: boolean
  position?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const siteLocales = await getSiteLocales()
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

  if (nextKind === 'INVOICE') {
    const otherInvoice = await db.billingDocumentTemplate.findFirst({
      where: {
        kind: 'INVOICE',
        id: { not: id }
      }
    })
    if (otherInvoice) {
      throw createError({ statusCode: 400, statusMessage: 'Un seul modèle de facture est autorisé' })
    }
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
  if (body.isDefault !== undefined || nextKind === 'INVOICE') data.isDefault = nextKind === 'INVOICE' ? true : Boolean(body.isDefault)
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
    const existingColumns = sanitizeBillingDocumentInvoiceColumns(existing.invoiceColumnsJson, siteLocales)
    const incomingColumns = sanitizeBillingDocumentInvoiceColumns(body.invoiceColumns, siteLocales)
    const existingMap = new Map(existingColumns.map((column) => [column.key, column]))

    const mergedInvoiceColumns = incomingColumns.map((column) => {
      const current = existingMap.get(column.key)
      const mergedLocales = new Set([
        ...Object.keys(current?.labelLocalized || {}),
        ...Object.keys(column.labelLocalized || {}),
      ])
      const labelLocalized = {} as CmsLocalizedText

      for (const locale of mergedLocales) {
        if (Object.prototype.hasOwnProperty.call(column.labelLocalized || {}, locale)) {
          labelLocalized[locale] = column.labelLocalized[locale] ?? ''
        } else if (current?.labelLocalized?.[locale] !== undefined) {
          labelLocalized[locale] = current.labelLocalized[locale]
        } else {
          labelLocalized[locale] = ''
        }
      }

      return {
        ...column,
        labelLocalized,
      }
    })

    data.invoiceColumnsJson = JSON.stringify(mergedInvoiceColumns)
  }
  if (body.invoiceOptions !== undefined) {
    data.invoiceOptionsJson = JSON.stringify(normalizeBillingDocumentInvoiceOptions(body.invoiceOptions))
  }

  const row = await db.billingDocumentTemplate.update({
    where: { id },
    data
  })

  if (row.isDefault) {
    await enforceSingleDefaultBillingDocument(nextKind, Number(row.id))
  }

  const saved = await db.billingDocumentTemplate.findUnique({ where: { id } })
  return serializeBillingDocumentTemplate(saved, siteLocales)
})
