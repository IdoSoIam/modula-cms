import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeShopOrder } from '#modula/server/utils/shop'

interface Body {
  status?: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
  paymentStatus?: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  }

  const body = await readBody<Body>(event)
  const data: Record<string, any> = {}
  if (body.status) {
    data.status = body.status
    if (body.status === 'PAID') data.paidAt = new Date()
    if (body.status === 'CANCELLED') data.cancelledAt = new Date()
  }
  if (body.paymentStatus) data.paymentStatus = body.paymentStatus

  const row = await db.shopOrder.update({
    where: { id },
    data,
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  return serializeShopOrder(row)
})
