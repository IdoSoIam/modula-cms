import { db } from '#modula/server/data/client'
import { createBillingDocumentPdfAttachment, findBillingDocumentTemplateById } from '#modula/server/utils/billingDocumentPdf'
import { serializeProduct, type ShopOrderPayload } from '#modula/server/utils/shop'

const textField = (value: unknown, limit = 200) => String(value || '').trim().slice(0, limit)
const amount = (value: unknown) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? Math.round(number * 100) / 100 : 0
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const template = Number.isInteger(id) && id > 0 ? await findBillingDocumentTemplateById(id) : null
  if (!template?.active || template.kind !== 'CONTRACT') {
    throw createError({ statusCode: 404, statusMessage: 'Contrat introuvable' })
  }

  const body = await readBody(event)
  const sourceItems = Array.isArray(body?.items) ? body.items.slice(0, 20) : []
  const contractItem = sourceItems.find((item: any) => Number(item?.productId) > 0
    && Array.isArray(item?.associatedDocuments)
    && item.associatedDocuments.some((document: any) => Number(document?.documentId) === id))
  if (!contractItem || !sourceItems.length || !textField(body?.customerName) || !textField(body?.email)) {
    throw createError({ statusCode: 400, statusMessage: 'Coordonnées et location requises pour consulter le contrat.' })
  }
  const productRow = await db.product.findUnique({ where: { id: Number(contractItem.productId) } })
  const product = productRow ? serializeProduct(productRow) : null
  if (!product || !product.detailSections.some((section) => section.items.some((item) => item.mediaDocumentId === id && item.mediaKind === 'billingDocument'))) {
    throw createError({ statusCode: 404, statusMessage: 'Contrat non lié à ce produit.' })
  }

  const lines: ShopOrderPayload['lines'] = []
  for (const item of sourceItems) {
    const quantity = Math.min(100, Math.max(1, Math.round(Number(item?.quantity) || 1)))
    const rentalStartDate = textField(item?.rentalStartDate, 40) || null
    const rentalEndDate = textField(item?.rentalEndDate, 40) || null
    if (item?.saleType === 'RENTAL' && (!rentalStartDate || !rentalEndDate || !Number.isFinite(Date.parse(rentalStartDate)) || !Number.isFinite(Date.parse(rentalEndDate)))) {
      throw createError({ statusCode: 400, statusMessage: 'Période de location invalide.' })
    }
    const insurance = Array.isArray(item?.insuranceSelections) ? item.insuranceSelections.slice(0, 20) : []
    const options = Array.isArray(item?.optionSelections) ? item.optionSelections.slice(0, 30) : []
    const insuranceTotal = insurance.reduce((sum: number, entry: any) => sum + amount(entry?.unitPrice) * quantity, 0)
    const optionsTotal = options.reduce((sum: number, entry: any) => sum + amount(entry?.totalPrice), 0)
    const baseTotal = Math.max(0, amount(item?.totalPrice) - insuranceTotal - optionsTotal)
    const productId = Number(item?.productId) || null
    lines.push({
      id: 0, orderId: 0, productId, title: textField(item?.title) || 'Location', quantity,
      unitPrice: baseTotal / quantity, totalPrice: baseTotal, rentalStartDate, rentalEndDate,
      meta: { saleType: item?.saleType === 'RENTAL' ? 'RENTAL' : 'SALE', vatRate: amount(item?.vatRate), rentalDepositAmount: amount(item?.rentalDepositAmount), rentalPartySize: Number(item?.rentalPartySize) > 0 ? Math.round(Number(item.rentalPartySize)) : null },
    })
    for (const entry of insurance) {
      lines.push({ id: 0, orderId: 0, productId: null, title: textField(entry?.name) || 'Assurance', quantity,
        unitPrice: amount(entry?.unitPrice), totalPrice: amount(entry?.unitPrice) * quantity, rentalStartDate: null, rentalEndDate: null,
        meta: { vatRate: amount(item?.vatRate), relatedProductId: productId },
      })
    }
    for (const entry of options) {
      const optionQuantity = Math.min(100, Math.max(1, Math.round(Number(entry?.quantity) || 1)))
      lines.push({ id: 0, orderId: 0, productId: null, title: textField(entry?.label) || 'Option', quantity: optionQuantity,
        unitPrice: amount(entry?.totalPrice) / optionQuantity, totalPrice: amount(entry?.totalPrice), rentalStartDate: null, rentalEndDate: null,
        meta: { vatRate: amount(item?.vatRate), relatedProductId: productId },
      })
    }
  }
  const total = lines.reduce((sum, line) => sum + line.totalPrice, 0)
  const now = new Date().toISOString()
  const order = {
    orderNumber: 'APERÇU', language: textField(body?.locale, 10) || 'fr', currency: 'EUR', createdAt: now,
    customerName: textField(body.customerName), email: textField(body.email), phone: textField(body.phone, 50) || null,
    billingAddress: textField(body.billingAddress), billingCity: textField(body.billingCity, 100),
    billingPostalCode: textField(body.billingPostalCode, 20), billingCountry: textField(body.billingCountry, 100),
    rentalStartDate: textField(contractItem.rentalStartDate, 40) || null,
    rentalEndDate: textField(contractItem.rentalEndDate, 40) || null,
    paymentStatus: 'UNPAID', total, subtotal: total, lines,
  } as ShopOrderPayload
  const attachment = await createBillingDocumentPdfAttachment({
    template, kind: 'CONTRACT', locale: order.language, filenameBase: 'contrat-apercu', order, product, preview: true,
  })
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', 'inline; filename="contrat-apercu.pdf"')
  setHeader(event, 'Cache-Control', 'no-store')
  return Buffer.from(attachment.contentBase64, 'base64')
})
