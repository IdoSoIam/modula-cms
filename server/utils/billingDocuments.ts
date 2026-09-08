import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import { db } from '#modula/server/data/client'
import { slugify } from '#modula/server/utils/slug'
import {
  BILLING_DOCUMENT_INVOICE_COLUMN_ORDER,
  createDefaultBillingDocumentInvoiceOptions,
  createDefaultBillingDocumentInvoiceColumns,
  type BillingDocumentInvoiceColumnConfig,
  type BillingDocumentInvoiceColumnKey,
  type BillingDocumentInvoiceOptions,
  type BillingDocumentKind,
} from '#modula/shared/billingDocuments'

export { createDefaultBillingDocumentInvoiceColumns }
export type {
  BillingDocumentInvoiceColumnConfig,
  BillingDocumentInvoiceColumnKey,
  BillingDocumentInvoiceOptions,
  BillingDocumentKind,
} from '#modula/shared/billingDocuments'
export { createDefaultBillingDocumentInvoiceOptions } from '#modula/shared/billingDocuments'

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
  rentalHourlyPrice: number | null
  rentalDailyPrice: number | null
  requiredForRental: boolean
  titleLocalized: CmsLocalizedText
  contentLocalized: CmsLocalizedText
  footerLocalized: CmsLocalizedText
  invoiceColumns: BillingDocumentInvoiceColumnConfig[]
  invoiceOptions: BillingDocumentInvoiceOptions
  active: boolean
  isDefault: boolean
  position: number
  createdAt: string
  updatedAt: string
}

function resolveRequestedBillingDocumentLocales(locales?: string[] | null): string[] {
  const normalized = Array.isArray(locales)
    ? locales
      .map((locale) => String(locale || '').trim().toLowerCase())
      .filter((locale, index, list) => Boolean(locale) && list.indexOf(locale) === index)
    : []

  return normalized.length ? normalized : ['fr', 'en']
}

function resolveBillingDocumentLocales(
  locales: string[] = ['fr', 'en'],
  value?: unknown,
): string[] {
  const merged = new Set(
    locales
      .map((locale) => String(locale || '').trim().toLowerCase())
      .filter(Boolean),
  )

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const normalized = String(key || '').trim().toLowerCase()
      if (normalized) {
        merged.add(normalized)
      }
    }
  }

  if (!merged.size) {
    merged.add('fr')
    merged.add('en')
  }

  return Array.from(merged)
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

  const resolvedLocales = resolveBillingDocumentLocales(locales, value)
  const normalized = createEmptyCmsLocalizedText(resolvedLocales)
  if (value && typeof value === 'object') {
    for (const [locale, entry] of Object.entries(value as Record<string, unknown>)) {
      const key = String(locale || '').trim().toLowerCase()
      if (!key) continue
      normalized[key] = typeof entry === 'string' ? entry : ''
    }
  }

  if (fallback.trim()) {
    for (const locale of resolvedLocales) {
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

  const detectedLocales = new Set(
    locales
      .map((locale) => String(locale || '').trim().toLowerCase())
      .filter(Boolean),
  )
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const localized = (entry as Record<string, unknown>).labelLocalized
      if (localized && typeof localized === 'object' && !Array.isArray(localized)) {
        for (const locale of Object.keys(localized as Record<string, unknown>)) {
          const normalized = String(locale || '').trim().toLowerCase()
          if (normalized) {
            detectedLocales.add(normalized)
          }
        }
      }
    }
  }
  const resolvedLocales = detectedLocales.size ? Array.from(detectedLocales) : ['fr', 'en']
  const defaults = createDefaultBillingDocumentInvoiceColumns(resolvedLocales)
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
        resolvedLocales,
      ),
    })
  }

  return BILLING_DOCUMENT_INVOICE_COLUMN_ORDER.map((key) => normalized.get(key) || defaultMap.get(key)!)
}

export function sanitizeBillingDocumentInvoiceColumns(
  value: unknown,
  locales: string[] = ['fr', 'en'],
): BillingDocumentInvoiceColumnConfig[] {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return sanitizeBillingDocumentInvoiceColumns(JSON.parse(trimmed), locales)
      } catch {
        return createDefaultBillingDocumentInvoiceColumns(locales)
      }
    }
    return createDefaultBillingDocumentInvoiceColumns(locales)
  }

  const defaults = createDefaultBillingDocumentInvoiceColumns(locales)
  const defaultMap = new Map(defaults.map((entry) => [entry.key, entry]))
  const sourceMap = new Map<BillingDocumentInvoiceColumnKey, Record<string, unknown>>()

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const key = String((entry as Record<string, unknown>).key || '').trim() as BillingDocumentInvoiceColumnKey
      if (!defaultMap.has(key)) continue
      sourceMap.set(key, entry as Record<string, unknown>)
    }
  }

  return BILLING_DOCUMENT_INVOICE_COLUMN_ORDER.map((key) => {
    const fallback = defaultMap.get(key)!
    const source = sourceMap.get(key)
    const localized: CmsLocalizedText = {}
    const rawLocalized = source?.labelLocalized

    if (rawLocalized && typeof rawLocalized === 'object' && !Array.isArray(rawLocalized)) {
      for (const [locale, entry] of Object.entries(rawLocalized as Record<string, unknown>)) {
        const normalizedLocale = String(locale || '').trim().toLowerCase()
        if (!normalizedLocale) continue
        localized[normalizedLocale] = typeof entry === 'string' ? entry : ''
      }
    }

    for (const locale of locales) {
      if (localized[locale] === undefined) {
        localized[locale] = fallback.labelLocalized[locale] ?? fallback.labelLocalized.fr ?? ''
      }
    }

    return {
      key,
      enabled: source?.enabled !== false,
      labelLocalized: localized,
    }
  })
}

export function deserializeBillingDocumentInvoiceColumns(
  value: unknown,
  locales: string[] = ['fr', 'en'],
): BillingDocumentInvoiceColumnConfig[] {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        return deserializeBillingDocumentInvoiceColumns(JSON.parse(trimmed), locales)
      } catch {
        return createDefaultBillingDocumentInvoiceColumns(locales)
      }
    }
    return createDefaultBillingDocumentInvoiceColumns(locales)
  }

  const defaults = createDefaultBillingDocumentInvoiceColumns(locales)
  const defaultMap = new Map(defaults.map((entry) => [entry.key, entry]))
  const sourceMap = new Map<BillingDocumentInvoiceColumnKey, Record<string, unknown>>()

  if (Array.isArray(value)) {
    for (const entry of value) {
      if (!entry || typeof entry !== 'object') continue
      const key = String((entry as Record<string, unknown>).key || '').trim() as BillingDocumentInvoiceColumnKey
      if (!defaultMap.has(key)) continue
      sourceMap.set(key, entry as Record<string, unknown>)
    }
  }

  return BILLING_DOCUMENT_INVOICE_COLUMN_ORDER.map((key) => {
    const fallback = defaultMap.get(key)!
    const source = sourceMap.get(key)
    const localized: CmsLocalizedText = {}
    const rawLocalized = source?.labelLocalized

    if (rawLocalized && typeof rawLocalized === 'object' && !Array.isArray(rawLocalized)) {
      for (const [locale, entry] of Object.entries(rawLocalized as Record<string, unknown>)) {
        const normalizedLocale = String(locale || '').trim().toLowerCase()
        if (!normalizedLocale) continue
        localized[normalizedLocale] = typeof entry === 'string' ? entry : ''
      }
    } else {
      for (const [locale, entry] of Object.entries(fallback.labelLocalized)) {
        localized[locale] = entry
      }
    }

    return {
      key,
      enabled: source?.enabled !== false,
      labelLocalized: localized,
    }
  })
}

export function normalizeBillingDocumentInvoiceOptions(
  value: unknown,
): BillingDocumentInvoiceOptions {
  const defaults = createDefaultBillingDocumentInvoiceOptions()

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        return normalizeBillingDocumentInvoiceOptions(JSON.parse(trimmed))
      } catch {
        return defaults
      }
    }
    return defaults
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults
  }

  const record = value as Record<string, unknown>
  return {
    showDeliveryMethod: record.showDeliveryMethod !== false,
  }
}

export function serializeBillingDocumentTemplate(
  row: any,
  locales?: string[] | null,
): BillingDocumentTemplatePayload {
  const resolvedLocales = resolveRequestedBillingDocumentLocales(locales)
  const titleLocalized = normalizeBillingDocumentLocalizedText(row.titleJson, '', resolvedLocales)
  const contentLocalized = normalizeBillingDocumentLocalizedText(row.contentJson, '', resolvedLocales)
  const footerLocalized = normalizeBillingDocumentLocalizedText(row.footerJson, '', resolvedLocales)
  const invoiceColumns = deserializeBillingDocumentInvoiceColumns(row.invoiceColumnsJson, resolvedLocales)
  const invoiceOptions = normalizeBillingDocumentInvoiceOptions(row.invoiceOptionsJson)

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
    rentalHourlyPrice: row.rentalHourlyPrice == null ? null : Number(row.rentalHourlyPrice),
    rentalDailyPrice: row.rentalDailyPrice == null ? null : Number(row.rentalDailyPrice),
    requiredForRental: Boolean(row.requiredForRental),
    titleLocalized,
    contentLocalized,
    footerLocalized,
    invoiceColumns,
    invoiceOptions,
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

export function normalizeOptionalBillingPrice(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(Math.max(0, amount) * 100) / 100 : null
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
