import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const items = await prisma.reservation.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      basket: true,
      pickupPoint: true,
      deliveryTour: { include: { cities: true } }
    }
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
    basket: { id: r.basket.id, name: r.basket.name, finalPrice: Number(r.basket.finalPrice) },
    deliveryType: r.deliveryType,
    deliveryAddress: r.deliveryAddress,
    deliveryCity: r.deliveryCity,
    deliveryPostalCode: r.deliveryPostalCode,
    monthlySubscription: r.monthlySubscription,
    pickupPoint: r.pickupPoint ? { id: r.pickupPoint.id, name: r.pickupPoint.name, address: r.pickupPoint.address } : null,
    deliveryTour: r.deliveryTour ? { id: r.deliveryTour.id, name: r.deliveryTour.name, dayOfWeek: r.deliveryTour.dayOfWeek, startTime: r.deliveryTour.startTime, endTime: r.deliveryTour.endTime, monthlyPrice: r.deliveryTour.monthlyPrice ? Number(r.deliveryTour.monthlyPrice) : null, cities: r.deliveryTour.cities.map(c => c.city) } : null
  }))
})
