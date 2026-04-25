import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.reservation.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { basket: true }
  })
  return items.map(r => ({
    id: r.id,
    customerName: r.customerName,
    email: r.email,
    phone: r.phone,
    message: r.message,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: r.createdAt,
    confirmedAt: r.confirmedAt,
    basket: { id: r.basket.id, name: r.basket.name, finalPrice: Number(r.basket.finalPrice) }
  }))
})
