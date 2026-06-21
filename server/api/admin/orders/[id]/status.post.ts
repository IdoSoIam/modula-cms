import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { sendShopOrderTransitionNotifications } from '#modula/server/services/shop/shopOrderEmails'
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
  const previous = await db.shopOrder.findUnique({
    where: { id },
    select: {
      status: true,
      paymentStatus: true,
      paymentFailureReason: true
    }
  })
  if (!previous) {
    throw createError({ statusCode: 404, statusMessage: 'Commande introuvable' })
  }

  const data: Record<string, any> = {}
  if (body.status) {
    data.status = body.status
    if (body.status === 'PAID') data.paidAt = new Date()
    if (body.status === 'CANCELLED') data.cancelledAt = new Date()
  }
  if (body.paymentStatus) {
    data.paymentStatus = body.paymentStatus
    if (body.paymentStatus === 'PAID') {
      data.paidAt = data.paidAt || new Date()
      data.paymentFailureReason = null
    }
    if (body.paymentStatus === 'REFUNDED') {
      data.refundedAt = new Date()
      data.paymentFailureReason = null
    }
    if (body.paymentStatus === 'PENDING' || body.paymentStatus === 'UNPAID') {
      data.refundedAt = null
      data.paymentFailureReason = null
    }
  }

  const row = await db.shopOrder.update({
    where: { id },
    data,
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  await sendShopOrderTransitionNotifications(id, {
    previousStatus: previous.status,
    previousPaymentStatus: previous.paymentStatus,
    previousPaymentFailureReason: previous.paymentFailureReason ?? null
  })

  return serializeShopOrder(row)
})
