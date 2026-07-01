import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import { db } from '#modula/server/data/client'
import { slugify } from '#modula/server/utils/slug'
import {
  BILLING_DOCUMENT_INVOICE_COLUMN_ORDER,
  createDefaultBillingDocumentInvoiceColumns,
  type BillingDocumentInvoiceColumnConfig,
  type BillingDocumentInvoiceColumnKey,
  type BillingDocumentKind,
} from '#modula/shared/billingDocuments'

export { createDefaultBillingDocumentInvoiceColumns }
export type {
  BillingDocumentInvoiceColumnConfig,
  BillingDocumentInvoiceColumnKey,
  BillingDocumentKind,
} from '#modula/shared/billingDocuments'

export interface BillingDocumentTemplatePayload {
  id: number
  kind: BillingDocumentKind
  slug: string
  name: string
  description: string | null
  brandName: string | null
  logoUrl: string | null
  accentColor: string | null
  sourcePdfUrl: string | null
  titleLocalized: CmsLocalizedText
  contentLocalized: CmsLocalizedText
  footerLocalized: CmsLocalizedText
  invoiceColumns: BillingDocumentInvoiceColumnConfig[]
  active: boolean
  isDefault: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export function normalizeBillingDocumentLocalizedText(
  value: unknown,
  fallback = '',
  locales: string[] = ['fr', 'en']
): CmsLocalizedText {
  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        return normalizeBillingDocumentLocalizedText(JSON.parse(text), fallback, locales)
      } catch {
        return Object.fromEntries(locales.map((locale) => [locale, text || fallback])) as CmsLocalizedText
      }
    }
    return Object.fromEntries(locales.map((locale) => [locale, text || fallback])) as CmsLocalizedText
  }

  const normalized = createEmptyCmsLocalizedText(locales)
  if (value && typeof value === 'object') {
    for (const [locale, entry] of Object.entries(value as Record<string, unknown>)) {
      const key = String(locale || '').trim().toLowerCase()
      if (!key) continue
      normalized[key] = typeof entry === 'string' ? entry : ''
    }
  }

  if (fallback.trim()) {
    for (const locale of locales) {
      if (!normalized[locale]?.trim()) {
        normalized[locale] = fallback
      }
    }
  }

  return normalized
}

export function normalizeBillingDocumentInvoiceColumns(
  value: unknown,
  locales: string[] = ['fr', 'en'],
): BillingDocumentInvoiceColumnConfig[] {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return normalizeBillingDocumentInvoiceColumns(JSON.parse(trimmed), locales)
      } catch {
        return createDefaultBillingDocumentInvoiceColumns(locales)
      }
    }
    return createDefaultBillingDocumentInvoiceColumns(locales)
  }

  const defaults = createDefaultBillingDocumentInvoiceColumns(locales)
  const defaultMap = new Map(defaults.map((entry) => [entry.key, entry]))
  const entries = Array.isArray(value) ? value : []
  const normalized = new Map<BillingDocumentInvoiceColumnKey, BillingDocumentInvoiceColumnConfig>()

  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') continue
    const rawKey = String((entry as Record<string, unknown>).key || '').trim() as BillingDocumentInvoiceColumnKey
    if (!defaultMap.has(rawKey)) continue
    const fallback = defaultMap.get(rawKey)!
    normalized.set(rawKey, {
      key: rawKey,
      enabled: (entry as Record<string, unknown>).enabled !== false,
      labelLocalized: normalizeBillingDocumentLocalizedText(
        (entry as Record<string, unknown>).labelLocalized,
        pickCmsLocalizedText('fr', fallback.labelLocalized, 'en') || '',
        locales,
      ),
    })
  }

  return BILLING_DOCUMENT_INVOICE_COLUMN_ORDER.map((key) => normalized.get(key) || defaultMap.get(key)!)
}

export function serializeBillingDocumentTemplate(row: any): BillingDocumentTemplatePayload {
  const titleLocalized = normalizeBillingDocumentLocalizedText(row.titleJson)
  const contentLocalized = normalizeBillingDocumentLocalizedText(row.contentJson)
  const footerLocalized = normalizeBillingDocumentLocalizedText(row.footerJson)
  const invoiceColumns = normalizeBillingDocumentInvoiceColumns(row.invoiceColumnsJson)

  return {
    id: Number(row.id),
    kind: row.kind === 'INVOICE'
      ? 'INVOICE'
      : row.kind === 'ASSURANCE'
        ? 'ASSURANCE'
        : 'CONTRACT',
    slug: String(row.slug),
    name: String(row.name),
    description: row.description ?? null,
    brandName: row.brandName?.trim() || null,
    logoUrl: row.logoUrl?.trim() || null,
    accentColor: row.accentColor?.trim() || null,
    sourcePdfUrl: row.sourcePdfUrl?.trim() || null,
    titleLocalized,
    contentLocalized,
    footerLocalized,
    invoiceColumns,
    active: Boolean(row.active),
    isDefault: Boolean(row.isDefault),
    position: Number(row.position || 0),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString()
  }
}

export function buildBillingDocumentLocalizedPayload(value: unknown, fallback = '') {
  const normalized = normalizeBillingDocumentLocalizedText(value, fallback)
  return {
    text: pickCmsLocalizedText('fr', normalized, 'en') || fallback,
    json: JSON.stringify(normalized)
  }
}

export async function ensureUniqueBillingDocumentSlug(source: string, excludeId?: number) {
  const base = slugify(source || 'document')
  let slug = base
  let suffix = 2

  while (true) {
    const existing = await db.billingDocumentTemplate.findFirst({
      where: excludeId ? { slug, id: { not: excludeId } } : { slug }
    })
    if (!existing) return slug
    slug = `${base}-${suffix}`
    suffix += 1
  }
}

export async function enforceSingleDefaultBillingDocument(kind: BillingDocumentKind, id: number) {
  await db.billingDocumentTemplate.updateMany({
    where: {
      kind,
      id: { not: id }
    },
    data: {
      isDefault: false
    }
  })
}
