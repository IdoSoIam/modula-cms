import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const monthStart = startOfMonth(new Date())

  const [
    activeProducts,
    totalProducts,
    categories,
    pendingOrders,
    paidOrders,
    cancelledOrders,
    unpaidOrders,
    monthOrders
  ] = await Promise.all([
    db.product.count({ where: { active: true } }),
    db.product.count(),
    db.productCategory.count({ where: { active: true } }),
    db.shopOrder.count({ where: { status: 'PENDING' } }),
    db.shopOrder.count({ where: { paymentStatus: 'PAID' } }),
    db.shopOrder.count({ where: { status: 'CANCELLED' } }),
    db.shopOrder.count({ where: { paymentStatus: { in: ['UNPAID', 'FAILED'] } } }),
    db.shopOrder.count({ where: { createdAt: { gte: monthStart } } })
  ])

  return {
    activeProducts,
    totalProducts,
    categories,
    pendingOrders,
    paidOrders,
    cancelledOrders,
    unpaidOrders,
    monthOrders
  }
})
