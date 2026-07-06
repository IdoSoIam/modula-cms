import { renderPublicBillingDocumentPdf } from '#modula/server/utils/billingDocumentPdf'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Document invalide' })
  }

  const query = getQuery(event)
  const productId = Number(query.productId || 0) || null
  const locale = String(query.locale || 'fr')
  const pdf = await renderPublicBillingDocumentPdf({
    documentId: id,
    productId,
    locale,
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="document-${id}.pdf"`)
  return pdf
})
