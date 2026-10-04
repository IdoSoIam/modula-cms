import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { createBillingDocumentPdfAttachment } from '#modula/server/utils/billingDocumentPdf'
import { getSiteLocales } from '#modula/server/utils/settings'
import {
  createDefaultBillingDocumentInvoiceOptions,
  createDefaultBillingDocumentInvoiceColumns,
  normalizeBillingDocumentInvoiceOptions,
  normalizeBillingDocumentInvoiceColumns,
  normalizeBillingDocumentLocalizedText,
  type BillingDocumentInvoiceColumnConfig,
  type BillingDocumentKind,
  type BillingDocumentTemplatePayload,
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
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const siteLocales = await getSiteLocales()
  const body = await readBody<Body>(event)
  const kind = body.kind === 'INVOICE'
    ? 'INVOICE'
    : body.kind === 'ASSURANCE'
      ? 'ASSURANCE'
      : 'CONTRACT'
  const name = String(body.name || '').trim() || (kind === 'INVOICE' ? 'Facture' : kind === 'ASSURANCE' ? 'Assurance' : 'Contrat')
  const previewRentalStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const previewRentalEndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()

  const template: BillingDocumentTemplatePayload = {
    id: 0,
    kind,
    slug: String(body.slug || '').trim() || 'preview',
    name,
    description: body.description?.trim() || null,
    brandName: body.brandName?.trim() || null,
    logoUrl: body.logoUrl?.trim() || null,
    accentColor: body.accentColor?.trim() || null,
    sourcePdfUrl: body.sourcePdfUrl?.trim() || null,
    rentalHourlyPrice: null,
    rentalDailyPrice: null,
    requiredForRental: false,
    titleLocalized: normalizeBillingDocumentLocalizedText(body.titleLocalized, name, siteLocales),
    contentLocalized: normalizeBillingDocumentLocalizedText(body.contentLocalized, '', siteLocales),
    footerLocalized: normalizeBillingDocumentLocalizedText(body.footerLocalized, '', siteLocales),
    invoiceColumns: kind === 'INVOICE'
      ? normalizeBillingDocumentInvoiceColumns(body.invoiceColumns, siteLocales)
      : createDefaultBillingDocumentInvoiceColumns(siteLocales),
    invoiceOptions: kind === 'INVOICE'
      ? normalizeBillingDocumentInvoiceOptions(body.invoiceOptions)
      : createDefaultBillingDocumentInvoiceOptions(),
    active: true,
    isDefault: false,
    position: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  }

  const attachment = await createBillingDocumentPdfAttachment({
    template,
    kind,
    locale: 'fr',
    filenameBase: template.slug || 'preview',
    order: kind !== 'ASSURANCE'
      ? {
          id: 0,
          orderNumber: 'CMD-PREVIEW',
          language: 'fr',
          status: 'CONFIRMED',
          paymentProvider: 'STRIPE',
          paymentStatus: 'PAID',
          afterSalesStatus: 'NONE',
          providerSessionId: null,
          providerPaymentIntentId: null,
          providerPaymentStatus: null,
          providerLastEventId: null,
          paymentFailureReason: null,
          refundRequestReason: null,
          refundRequestNote: null,
          refundRequestedAt: null,
          refundReviewedAt: null,
          customerName: 'Client exemple',
          email: 'client@example.com',
          phone: '06 00 00 00 00',
          message: 'Ceci est un apercu de document genere depuis l administration.',
          deliveryType: 'PICKUP',
          pickupPointId: null,
          pickupPoint: null,
          deliveryTourId: null,
          deliveryTour: null,
          deliveryAddress: '12 rue des Alouettes',
          deliveryCity: 'Toulouse',
          deliveryPostalCode: '31000',
          deliveryCountry: 'France',
          billingAddress: '12 rue des Alouettes',
          billingCity: 'Toulouse',
          billingPostalCode: '31000',
          billingCountry: 'France',
          rentalStartDate: kind === 'CONTRACT' ? previewRentalStartDate : null,
          rentalEndDate: kind === 'CONTRACT' ? previewRentalEndDate : null,
          fulfillmentDate: new Date().toISOString(),
          fulfillmentTime: '17:30-19:00',
          fulfillmentLocation: 'Point relais centre-ville',
          currency: 'eur',
          subtotal: 145,
          total: 145,
          checkoutUrl: null,
          paidAt: new Date().toISOString(),
          refundedAt: null,
          cancelledAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerAction: {
            kind: 'NONE',
            reason: null,
            engaged: false,
          },
          lines: [
            {
              id: 0,
              orderId: 0,
              productId: null,
              title: kind === 'CONTRACT' ? 'Bateau exemple' : 'Produit exemple premium',
              quantity: 1,
              unitPrice: 120,
              totalPrice: 120,
              rentalStartDate: kind === 'CONTRACT' ? previewRentalStartDate : null,
              rentalEndDate: kind === 'CONTRACT' ? previewRentalEndDate : null,
              meta: kind === 'CONTRACT'
                ? { slug: 'bateau-exemple', vatRate: 20, saleType: 'RENTAL', rentalDepositAmount: 600 }
                : { slug: 'produit-exemple-premium', vatRate: 20, saleType: 'SALE' },
            },
            {
              id: 1,
              orderId: 0,
              productId: null,
              title: 'Accessoire complementaire',
              quantity: 1,
              unitPrice: 25,
              totalPrice: 25,
              rentalStartDate: null,
              rentalEndDate: null,
              meta: { slug: 'accessoire-complementaire', vatRate: 0, saleType: 'SALE' },
            },
          ],
        }
      : undefined,
  })

  setHeader(event, 'Content-Type', attachment.mimeType)
  setHeader(event, 'Content-Disposition', `inline; filename="${attachment.filename}"`)
  return Buffer.from(attachment.contentBase64, 'base64')
})
