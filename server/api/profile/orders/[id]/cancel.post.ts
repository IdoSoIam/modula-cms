import { AuthService } from '#modula/server/services/auth/authService'
import { db } from '#modula/server/data/client'
import { cancelShopOrder, refundShopOrder } from '#modula/server/services/shop/shopOrderMutations'
import { computeShopOrderCustomerActionState } from '#modula/server/utils/shop'

const authService = new AuthService()

function parseLineMeta(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const user = await authService.getUserFromSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
      message: "L'identifiant de commande est invalide.",
    })
  }

  const order = await db.shopOrder.findFirst({
    where: {
      id,
      userId: user.id,
      status: { not: 'DRAFT' },
    },
    include: {
      lines: true,
    },
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  const actionState = computeShopOrderCustomerActionState({
    status: order.status,
    paymentStatus: order.paymentStatus,
    afterSalesStatus: order.afterSalesStatus,
    deliveryType: order.deliveryType,
    fulfillmentDate: order.fulfillmentDate ? new Date(order.fulfillmentDate).toISOString() : null,
    fulfillmentTime: order.fulfillmentTime ?? null,
    lines: order.lines.map((line: any) => ({
      meta: parseLineMeta(line.metaJson),
    })),
  })

  if (actionState.kind === 'CANCEL') {
    return await cancelShopOrder(id)
  }

  if (actionState.kind === 'CANCEL_AND_REFUND') {
    return await refundShopOrder(id)
  }

  throw createError({
    statusCode: 409,
    statusMessage: 'Order cannot be cancelled',
    message: 'Cette commande ne peut pas être annulée directement depuis votre espace client.',
  })
})
