import { AuthService } from '#modula/server/services/auth/authService'
import { db } from '#modula/server/data/client'
import { requestShopOrderRefund } from '#modula/server/services/shop/shopOrderMutations'

const authService = new AuthService()

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
    select: { id: true },
  })

  if (!order) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found',
      message: 'Commande introuvable.',
    })
  }

  const body = await readBody<{ reason?: string | null }>(event)
  return await requestShopOrderRefund(id, body?.reason ?? null)
})
