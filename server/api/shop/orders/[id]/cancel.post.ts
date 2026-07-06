import { cancelShopOrderCheckout } from '#modula/server/services/shop/shopOrderMutations'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id',
      message: "L'identifiant de commande est invalide.",
    })
  }

  return await cancelShopOrderCheckout(id)
})
