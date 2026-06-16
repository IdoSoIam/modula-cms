import { serializeBasket } from '#modula/server/utils/baskets'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')

  const featureFlags = await getFeatureFlags()
  if (!featureFlags.shop.enabled || !featureFlags.shop.basketsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Paniers introuvables' })
  }

  const baskets = await db.basket.findMany({
    where: { active: true },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
    include: { items: { include: { vegetable: true } } }
  })

  const ids = baskets.map(b => b.id)
  const counts = await db.reservation.groupBy({
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
