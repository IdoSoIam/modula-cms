import { AuthService } from '#modula/server/services/auth/authService'
import { db } from '#modula/server/data/client'
import { serializeShopOrder } from '#modula/server/utils/shop'

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const user = await authService.getUserFromSession(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid order id'
    })
  }

  const row = await db.shopOrder.findFirst({
    where: {
      id,
      userId: user.id,
      status: { not: 'DRAFT' }
    },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true
    }
  })

  if (!row) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Order not found'
    })
  }

  return serializeShopOrder(row)
})
