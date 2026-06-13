import { serializeBasket } from '#modula/server/utils/baskets'
import { getRuntimeReservationUsageCountsByBasketIds, isRuntimeD1Active, listRuntimeBaskets } from '#modula/server/platform/runtimeDb'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { prisma } from '../../../prisma/client'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const featureFlags = await getFeatureFlags()
  if (!featureFlags.shop.enabled || !featureFlags.shop.basketsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Paniers introuvables' })
  }

  if (isRuntimeD1Active()) {
    const baskets = await listRuntimeBaskets({ activeOnly: true })
    const counts = await getRuntimeReservationUsageCountsByBasketIds(baskets.map((basket) => basket.id))

    return baskets.map((basket) => {
      const used = counts.get(basket.id) ?? 0
      const remaining = Math.max(0, basket.available - used)
      return {
        id: basket.id,
        name: basket.name,
        description: basket.description,
        imageUrl: basket.imageUrl,
        finalPrice: Number(basket.finalPrice),
        remaining,
        available: basket.available,
        items: basket.items?.map((item: any) => ({
          quantity: Number(item.quantity),
          vegetable: {
            name: item.vegetable.name,
            unit: item.vegetable.unit,
            imageUrl: item.vegetable.imageUrl ?? null
          }
        }))
      }
    })
  }

  const baskets = await prisma.basket.findMany({
    where: { active: true },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { items: { include: { vegetable: true } } }
  })

  const ids = baskets.map(b => b.id)
  const counts = await prisma.reservation.groupBy({
    by: ['basketId'],
    where: { basketId: { in: ids }, status: { in: ['PENDING', 'CONFIRMED'] } },
    _count: { _all: true }
  })

  return baskets.map(b => {
    const used = counts.find(c => c.basketId === b.id)?._count._all ?? 0
    const remaining = Math.max(0, b.available - used)
    const s = serializeBasket(b)
    return {
      id: s.id,
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl,
      finalPrice: s.finalPrice,
      remaining,
      available: b.available,
      items: s.items?.map(it => ({
        quantity: it.quantity,
        vegetable: { name: it.vegetable.name, unit: it.vegetable.unit, imageUrl: it.vegetable.imageUrl ?? null }
      }))
    }
  })
})
