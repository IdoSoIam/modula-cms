import type { CmsLocalizedText } from '#modula/shared/cms'

export type BillingDocumentKind = 'INVOICE' | 'CONTRACT' | 'ASSURANCE'

export type BillingDocumentInvoiceColumnKey =
  | 'lineNumber'
  | 'designation'
  | 'reference'
  | 'quantity'
  | 'unitPriceHt'
  | 'totalHt'
  | 'vatRate'
  | 'vatAmount'
  | 'totalTtc'

export interface BillingDocumentInvoiceColumnConfig {
  key: BillingDocumentInvoiceColumnKey
  enabled: boolean
  labelLocalized: CmsLocalizedText
}

export interface BillingDocumentInvoiceOptions {
  showDeliveryMethod: boolean
}

export const BILLING_DOCUMENT_INVOICE_COLUMN_ORDER: BillingDocumentInvoiceColumnKey[] = [
  'lineNumber',
  'designation',
  'reference',
  'quantity',
  'unitPriceHt',
  'totalHt',
  'vatRate',
  'vatAmount',
  'totalTtc',
]

export const BILLING_DOCUMENT_INVOICE_COLUMN_LABELS: Record<BillingDocumentInvoiceColumnKey, { fr: string, en: string }> = {
  lineNumber: { fr: 'N°', en: 'No.' },
  designation: { fr: 'Désignation', en: 'Description' },
  reference: { fr: 'Réf.', en: 'Ref.' },
  quantity: { fr: 'Qté', en: 'Qty' },
  unitPriceHt: { fr: 'PU HT', en: 'Unit price excl. tax' },
  totalHt: { fr: 'Total HT', en: 'Total excl. tax' },
  vatRate: { fr: 'TVA', en: 'VAT' },
  vatAmount: { fr: 'TVA montant', en: 'VAT amount' },
  totalTtc: { fr: 'Total TTC', en: 'Total incl. tax' },
}

export function createDefaultBillingDocumentInvoiceOptions(): BillingDocumentInvoiceOptions {
  return {
    showDeliveryMethod: true,
  }
}

export function createDefaultBillingDocumentInvoiceColumns(
  locales: string[] = ['fr', 'en'],
): BillingDocumentInvoiceColumnConfig[] {
  return BILLING_DOCUMENT_INVOICE_COLUMN_ORDER.map((key) => {
    const labels = BILLING_DOCUMENT_INVOICE_COLUMN_LABELS[key]
    return {
      key,
      enabled: true,
      labelLocalized: Object.fromEntries(
        locales.map((locale) => [
          locale,
          locale === 'fr'
            ? labels.fr
            : locale === 'en'
              ? labels.en
              : '',
        ]),
      ) as CmsLocalizedText,
    }
  })
}
