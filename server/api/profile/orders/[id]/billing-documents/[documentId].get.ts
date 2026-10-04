import { AuthService } from '#modula/server/services/auth/authService'
import { db } from '#modula/server/data/client'
import { createBillingDocumentPdfAttachment, findBillingDocumentTemplateById } from '#modula/server/utils/billingDocumentPdf'
import { serializeProduct, serializeShopOrder } from '#modula/server/utils/shop'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const user = await authService.getUserFromSession(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const orderId = Number(getRouterParam(event, 'id'))
  const documentId = Number(getRouterParam(event, 'documentId'))
  if (!Number.isInteger(orderId) || orderId <= 0 || !Number.isInteger(documentId) || documentId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Document invalide' })
  }
  const row = await db.shopOrder.findFirst({
    where: { id: orderId, userId: user.id, status: { not: 'DRAFT' } },
    include: { lines: true, pickupPoint: true, deliveryTour: true },
  })
  if (!row) throw createError({ statusCode: 404, statusMessage: 'Commande introuvable' })
  const order = serializeShopOrder(row)
  const linkedLine = order.lines.find((line) => Array.isArray(line.meta?.linkedBillingDocuments)
    && line.meta.linkedBillingDocuments.some((document: any) => Number(document?.id) === documentId))
  if (!linkedLine) throw createError({ statusCode: 404, statusMessage: 'Document non lié à cette commande' })
  const template = await findBillingDocumentTemplateById(documentId)
  if (!template?.active) throw createError({ statusCode: 404, statusMessage: 'Document introuvable' })
  const productRow = linkedLine.productId ? await db.product.findUnique({ where: { id: linkedLine.productId } }) : null
  const attachment = await createBillingDocumentPdfAttachment({
    template, kind: template.kind, locale: order.language, filenameBase: `${template.slug}-${order.orderNumber}`,
    order, product: productRow ? serializeProduct(productRow) : null,
  })
  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `inline; filename="${attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '-') }"`)
  setHeader(event, 'Cache-Control', 'private, no-store')
  return Buffer.from(attachment.contentBase64, 'base64')
})
