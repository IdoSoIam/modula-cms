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

  const rows = await db.shopOrder.findMany({
    where: {
      userId: user.id,
      status: { not: 'DRAFT' }
    },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true
    },
    orderBy: [{ createdAt: 'desc' }]
  })

  return {
    items: rows.map(serializeShopOrder)
  }
})
