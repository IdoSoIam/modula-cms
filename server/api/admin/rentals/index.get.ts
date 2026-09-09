import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { serializeRentalReturn } from '#modula/server/services/shop/rentalReturns'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'shop_orders', 'read')

  const lines = await db.shopOrderLine.findMany({
    where: {
      rentalStartDate: { not: null },
      rentalEndDate: { not: null },
    },
    include: {
      order: true,
      product: true,
    },
    orderBy: { rentalStartDate: 'asc' },
  })
  const lineIds = lines.map((line: any) => Number(line.id))
  const returns = lineIds.length
    ? await db.rentalReturn.findMany({ where: { orderLineId: { in: lineIds } }, include: { actor: true } })
    : []
  const returnByLineId = new Map<number, ReturnType<typeof serializeRentalReturn>>(
    returns.map((entry: any) => [Number(entry.orderLineId), serializeRentalReturn(entry)]),
  )

  return lines
    .filter((line: any) => line.order && line.order.status !== 'DRAFT')
    .map((line: any) => {
      const meta = parseMeta(line.metaJson)
      const rentalReturn = returnByLineId.get(Number(line.id)) || null
      return {
      id: Number(line.id),
      orderId: Number(line.orderId),
      orderNumber: String(line.order.orderNumber || `#${line.orderId}`),
      product: String(line.title || line.product?.name || ''),
      customer: String(line.order.customerName || ''),
      email: String(line.order.email || ''),
      quantity: Number(line.quantity || 1),
      startAt: String(line.rentalStartDate),
      endAt: String(line.rentalEndDate),
      orderStatus: String(line.order.status || ''),
      paymentStatus: String(line.order.paymentStatus || ''),
      pricingMode: meta.rentalPricingMode === 'HOURLY' ? 'HOURLY' : 'DAILY',
      durationUnits: Number(meta.rentalDurationUnits || calculateDuration(line.rentalStartDate, line.rentalEndDate, meta.rentalPricingMode)),
      return: rentalReturn,
      returnStatus: rentalReturn?.status || 'EXPECTED',
      lateFeeEnabled: Boolean(meta.rentalLateFeeEnabled ?? line.product?.rentalLateFeeEnabled),
    }
    })
})

function parseMeta(value: unknown): Record<string, any> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return parsed && typeof parsed === 'object' ? parsed as Record<string, any> : {}
  } catch {
    return {}
  }
}

function calculateDuration(start: unknown, end: unknown, mode: unknown) {
  const milliseconds = new Date(String(end)).getTime() - new Date(String(start)).getTime()
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return 0
  return mode === 'HOURLY' ? milliseconds / 3600000 : Math.floor(milliseconds / 86400000) + 1
}
