import { db } from '#modula/server/data/client'
import { serializeShopOrder } from '#modula/server/utils/shop'
import { requirePermission } from '#modula/server/utils/permissions'
import { serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'

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

  const rentalDepositActions = rentalDeposit
    ? await db.rentalDepositAction.findMany({
        where: { depositId: rentalDeposit.id },
        include: { actor: true },
        orderBy: { createdAt: 'desc' },
      })
    : []
  const rentalReturns = await db.rentalReturn.findMany({
    where: { orderId: id },
    include: { actor: true },
    orderBy: { actualReturnAt: 'desc' },
  })

  return {
    ...serializeShopOrder(row),
    rentalDeposit: rentalDeposit
      ? {
          ...rentalDeposit,
          amount: Number(rentalDeposit.amount || 0),
          retainedAmount: Number(rentalDeposit.retainedAmount || 0),
          actions: rentalDepositActions.map((action: any) => ({
            id: action.id,
            action: action.action,
            releasedAmount: Number(action.releasedAmount || 0),
            retainedAmount: Number(action.retainedAmount || 0),
            note: action.note,
            providerReference: action.providerReference,
            createdAt: action.createdAt,
            actorName: action.actor
              ? [action.actor.firstName, action.actor.lastName].filter(Boolean).join(' ') || action.actor.email
              : null,
          })),
        }
      : null,
    rentalReturns: rentalReturns.map(serializeRentalReturn),
  }
})
