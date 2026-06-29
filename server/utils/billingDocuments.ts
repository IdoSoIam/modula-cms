import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import { db } from '#modula/server/data/client'
import { slugify } from '#modula/server/utils/slug'

export type BillingDocumentKind = 'INVOICE' | 'CONTRACT' | 'ASSURANCE'

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

export function serializeBillingDocumentTemplate(row: any): BillingDocumentTemplatePayload {
  const titleLocalized = normalizeBillingDocumentLocalizedText(row.titleJson)
  const contentLocalized = normalizeBillingDocumentLocalizedText(row.contentJson)
  const footerLocalized = normalizeBillingDocumentLocalizedText(row.footerJson)

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
