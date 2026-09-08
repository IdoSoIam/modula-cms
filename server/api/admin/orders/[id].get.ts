import { db } from '#modula/server/data/client'
import { serializeShopOrder } from '#modula/server/utils/shop'
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

  const [row, rentalDeposit] = await Promise.all([db.shopOrder.findFirst({
    where: {
      id,
      status: { not: 'DRAFT' },
    },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  }), db.rentalDeposit.findUnique({ where: { orderId: id } })])

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    })
  }

  return {
    ...serializeShopOrder(row),
    rentalDeposit: rentalDeposit
      ? {
          ...rentalDeposit,
          amount: Number(rentalDeposit.amount || 0),
          retainedAmount: Number(rentalDeposit.retainedAmount || 0),
        }
      : null,
  }
})
