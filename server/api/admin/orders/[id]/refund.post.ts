import { requirePermission } from '#modula/server/utils/permissions'
import { refundShopOrder } from '#modula/server/services/shop/shopOrderMutations'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
    })
  }

  return await refundShopOrder(id)
})
