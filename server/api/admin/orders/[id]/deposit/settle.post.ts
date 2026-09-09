import { db } from '#modula/server/data/client'
import { sendRentalDepositSettlementNotification } from '#modula/server/services/shop/shopOrderEmails'
import { requirePermission } from '#modula/server/utils/permissions'
import { resolveRentalDepositSettlement } from '#modula/shared/rentalDeposit'

interface SettlementBody {
  retainedAmount?: number
  note?: string | null
}

export default defineEventHandler(async (event) => {
  const sessionUser = await requirePermission(event, 'shop_orders', 'update')
  const orderId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw createError({ statusCode: 400, message: 'Commande invalide' })
  }

  const body = await readBody<SettlementBody>(event)
  const deposit = await db.rentalDeposit.findUnique({ where: { orderId } })
  if (!deposit) throw createError({ statusCode: 404, message: 'Aucun dépôt de garantie pour cette commande' })
  if (deposit.paymentMode !== 'ONSITE') {
    throw createError({
      statusCode: 409,
      message: 'La restitution en ligne sera disponible lorsque le remboursement partiel dédié sera pris en charge par le fournisseur de paiement.',
    })
  }
  if (deposit.status !== 'PAID') {
    throw createError({ statusCode: 409, message: 'Seul un dépôt de garantie versé peut être restitué ou retenu' })
  }

  const amount = Number(deposit.amount || 0)
  const requestedRetainedAmount = Number(body.retainedAmount || 0)
  const note = String(body.note || '').trim() || null
  let settlement: ReturnType<typeof resolveRentalDepositSettlement>
  try {
    settlement = resolveRentalDepositSettlement(amount, requestedRetainedAmount)
  } catch {
    throw createError({ statusCode: 400, message: 'Le montant retenu doit être compris entre zéro et le montant du dépôt' })
  }
  const { releasedAmount, retainedAmount, status } = settlement
  if (retainedAmount > 0 && !note) {
    throw createError({ statusCode: 400, message: 'Un motif est obligatoire lorsqu’un montant est retenu' })
  }

  const action = status

  const updated = await db.rentalDeposit.update({
    where: { id: deposit.id },
    data: {
      status,
      releasedAt: new Date(),
      retainedAmount,
      failureReason: null,
    },
  })

  try {
    await db.rentalDepositAction.create({
      data: {
        depositId: deposit.id,
        actorUserId: sessionUser.id,
        action,
        releasedAmount,
        retainedAmount,
        note,
        providerReference: null,
      },
    })
  } catch (error) {
    await db.rentalDeposit.update({
      where: { id: deposit.id },
      data: {
        status: deposit.status,
        releasedAt: deposit.releasedAt,
        retainedAmount: deposit.retainedAmount,
      },
    })
    throw error
  }

  await sendRentalDepositSettlementNotification(orderId, {
    status,
    amount: settlement.amount,
    releasedAmount,
    retainedAmount,
    note,
  })

  return updated
})
