import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'
import { serializeShopOrder } from '#modula/server/utils/shop'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const page = Math.max(1, Number(getQuery(event).page || 1))
  const limit = Math.min(100, Math.max(1, Number(getQuery(event).limit || 20)))
  const status = typeof getQuery(event).status === 'string' ? String(getQuery(event).status) : ''
  const skip = (page - 1) * limit

  const where = status ? { status } : undefined
  const [total, rows] = await Promise.all([
    db.shopOrder.count({ where }),
    db.shopOrder.findMany({
      where,
      include: { lines: true },
      orderBy: [{ createdAt: 'desc' }],
      take: limit,
      skip
    })
  ])

  return {
    items: rows.map(serializeShopOrder),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  }
})
