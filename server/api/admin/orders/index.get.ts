import { db } from '#modula/server/data/client'
import { serializeShopOrder } from '#modula/server/utils/shop'
import { requirePermission } from '#modula/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'read')

  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page || '1'), 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(String(query.limit || '20'), 10) || 20))
  const status = typeof query.status === 'string' ? query.status.trim().toUpperCase() : ''
  const paymentStatus = typeof query.paymentStatus === 'string' ? query.paymentStatus.trim().toUpperCase() : ''

  const where: Record<string, any> = {
    status: {
      not: 'DRAFT',
    },
  }

  if (status) {
    where.status = status
  }
  if (paymentStatus) {
    where.paymentStatus = paymentStatus
  }

  const [rows, total] = await Promise.all([
    db.shopOrder.findMany({
      where,
      include: {
        pickupPoint: true,
        deliveryTour: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      skip: (page - 1) * limit,
    }),
    db.shopOrder.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return {
    items: rows.map(serializeShopOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  }
})
