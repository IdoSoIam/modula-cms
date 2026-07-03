import { createInvoicePdfAttachmentForOrder } from '#modula/server/utils/billingDocumentPdf'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'read')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
    })
  }

  const attachment = await createInvoicePdfAttachmentForOrder(id)
  if (!attachment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Invoice not found',
    })
  }

  setHeader(event, 'Content-Type', attachment.mimeType)
  setHeader(event, 'Content-Disposition', `inline; filename="${attachment.filename}"`)
  return Buffer.from(attachment.contentBase64, 'base64')
})
