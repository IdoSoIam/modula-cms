import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  const sessionUser = await requirePermission(event, 'shop_orders', 'update')
  const orderId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Commande invalide' })
  }

  const deposit = await db.rentalDeposit.findUnique({ where: { orderId } })
  if (!deposit) throw createError({ statusCode: 404, message: 'Aucun dépôt de garantie pour cette commande' })
  if (deposit.paymentMode !== 'ONSITE') {
    throw createError({ statusCode: 409, message: 'Seul un dépôt de garantie versé sur place peut être validé manuellement' })
  }
  if (deposit.status === 'RELEASED' || deposit.status === 'RETAINED' || deposit.status === 'PARTIALLY_RETAINED') {
    throw createError({ statusCode: 409, message: 'Ce dépôt de garantie a déjà été clôturé' })
  }
  if (deposit.status === 'PAID') return deposit

  const paidAt = deposit.paidAt || new Date()
  const updated = await db.rentalDeposit.update({
    where: { id: deposit.id },
    data: { status: 'PAID', paidAt, failureReason: null },
  })

  try {
    await db.rentalDepositAction.create({
      data: {
        depositId: deposit.id,
        actorUserId: sessionUser.id,
        action: 'MARKED_PAID',
        releasedAmount: 0,
        retainedAmount: 0,
        note: null,
        providerReference: null,
      },
    })
    return updated
  }
  catch (error) {
    await db.rentalDeposit.update({
      where: { id: deposit.id },
      data: {
        status: deposit.status,
        paidAt: deposit.paidAt,
        failureReason: deposit.failureReason,
      },
    })
    throw error
  }
})
