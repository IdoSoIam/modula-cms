import { AuthService } from '#modula/server/services/auth/authService'
import { db } from '#modula/server/data/client'
import { serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'
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

  const [rentalDeposit, rentalReturns] = await Promise.all([
    db.rentalDeposit.findUnique({ where: { orderId: row.id } }),
    db.rentalReturn.findMany({ where: { orderId: row.id }, orderBy: { actualReturnAt: 'desc' } }),
  ])
  const latestSettlement = rentalDeposit
    ? await db.rentalDepositAction.findFirst({
        where: {
          depositId: rentalDeposit.id,
          action: { in: ['RELEASED', 'PARTIALLY_RETAINED', 'RETAINED'] },
        },
        orderBy: { createdAt: 'desc' },
      })
    : null

  return {
    ...serializeShopOrder(row),
    rentalDeposit: rentalDeposit
      ? {
          amount: Number(rentalDeposit.amount || 0),
          paymentMode: rentalDeposit.paymentMode,
          status: rentalDeposit.status,
          paidAt: rentalDeposit.paidAt,
          releasedAt: rentalDeposit.releasedAt,
          retainedAmount: Number(rentalDeposit.retainedAmount || 0),
          releasedAmount: latestSettlement ? Number(latestSettlement.releasedAmount || 0) : 0,
          settlementNote: latestSettlement?.note || null,
        }
      : null,
    rentalReturns: rentalReturns.map(serializeRentalReturn),
  }
})
