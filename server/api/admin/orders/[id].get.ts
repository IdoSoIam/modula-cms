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

  const row = await db.shopOrder.findFirst({
    where: {
      id,
      status: { not: 'DRAFT' },
    },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
    })
  }

  return serializeShopOrder(row)
})
