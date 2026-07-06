import { rejectShopOrderRefundRequest } from '#modula/server/services/shop/shopOrderMutations'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'update')

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
    })
  }

  const body = await readBody<{ note?: string | null }>(event)
  return await rejectShopOrderRefundRequest(id, body?.note ?? null)
})
