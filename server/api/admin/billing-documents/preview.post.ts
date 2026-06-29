import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { createBillingDocumentPdfAttachment } from '#modula/server/utils/billingDocumentPdf'
import {
  normalizeBillingDocumentLocalizedText,
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
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<Body>(event)
  const kind = body.kind === 'INVOICE'
    ? 'INVOICE'
    : body.kind === 'ASSURANCE'
      ? 'ASSURANCE'
      : 'CONTRACT'
  const name = String(body.name || '').trim() || (kind === 'INVOICE' ? 'Facture' : kind === 'ASSURANCE' ? 'Assurance' : 'Contrat')

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
    titleLocalized: normalizeBillingDocumentLocalizedText(body.titleLocalized, name),
    contentLocalized: normalizeBillingDocumentLocalizedText(body.contentLocalized),
    footerLocalized: normalizeBillingDocumentLocalizedText(body.footerLocalized),
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
    order: kind === 'INVOICE'
      ? {
          id: 0,
          orderNumber: 'CMD-PREVIEW',
          userId: null,
          language: 'fr',
          status: 'PAID',
          paymentProvider: 'STRIPE',
          paymentStatus: 'PAID',
          providerSessionId: null,
          providerPaymentIntentId: null,
          providerPaymentStatus: null,
          providerLastEventId: null,
          paymentFailureReason: null,
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
          rentalStartDate: null,
          rentalEndDate: null,
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
          lines: [
            {
              id: 0,
              orderId: 0,
              productId: null,
              productLotId: null,
              title: 'Produit exemple premium',
              quantity: 1,
              unitPrice: 120,
              totalPrice: 120,
              rentalStartDate: null,
              rentalEndDate: null,
              meta: { slug: 'produit-exemple-premium', vatRate: 20, saleType: 'SALE' },
            },
            {
              id: 1,
              orderId: 0,
              productId: null,
              productLotId: null,
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
