import type { CmsLocalizedText } from '#modula/shared/cms'

export interface ProductCategoryFieldDefinition {
  key: string
  label: string
  labelLocalized: CmsLocalizedText
  type: 'NUMBER' | 'TEXT'
  required: boolean
  purpose: 'NONE' | 'RENTAL_PARTY_CAPACITY'
}

export function normalizeProductCategoryFields(value: unknown): ProductCategoryFieldDefinition[] {
  let source = value
  if (typeof source === 'string') {
    try { source = JSON.parse(source) } catch { return [] }
  }
  if (!Array.isArray(source)) return []
  const seen = new Set<string>()
  const result: ProductCategoryFieldDefinition[] = []
  for (const entry of source) {
    if (!entry || typeof entry !== 'object') continue
    const key = String(entry.key || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    const labelLocalized = entry.labelLocalized && typeof entry.labelLocalized === 'object' && !Array.isArray(entry.labelLocalized)
      ? Object.fromEntries(Object.entries(entry.labelLocalized).map(([locale, text]) => [locale, String(text || '').trim().slice(0, 120)]))
      : { fr: String(entry.label || '').trim().slice(0, 120) }
    const label = String(labelLocalized.fr || Object.values(labelLocalized).find(Boolean) || entry.label || '').trim().slice(0, 120)
    if (!key || !label || seen.has(key)) continue
    seen.add(key)
    const type = entry.type === 'NUMBER' ? 'NUMBER' : 'TEXT'
    result.push({
      key, label, labelLocalized, type, required: Boolean(entry.required),
      purpose: type === 'NUMBER' && entry.purpose === 'RENTAL_PARTY_CAPACITY' ? 'RENTAL_PARTY_CAPACITY' : 'NONE',
    })
  }
  return result.slice(0, 30)
}

export function getRentalPartyCapacity(product: {
  category?: { fields?: ProductCategoryFieldDefinition[] } | null
  detailSections?: Array<{ items: Array<{ id: string, value: string }> }>
}): number | null {
  const definition = product.category?.fields?.find((field) => field.purpose === 'RENTAL_PARTY_CAPACITY')
  if (!definition) return null
  const detail = product.detailSections?.flatMap((section) => section.items)
    .find((item) => item.id === definition.key || item.id === `category-field:${definition.key}`)
  const match = String(detail?.value || '').match(/^\s*(\d+)/)
  const value = match ? Number(match[1]) : 0
  return Number.isSafeInteger(value) && value > 0 ? value : null
}
