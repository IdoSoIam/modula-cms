import { db } from '#modula/server/data/client'

export async function computeBasketPrice(basketId: number): Promise<number> {
  const items = await db.basketItem.findMany({
    where: { basketId },
    include: { vegetable: true }
  })
  return items.reduce((sum: number, it: any) => sum + Number(it.vegetable.price) * Number(it.quantity), 0)
}

export function serializeBasket<T extends { computedPrice: any; finalPrice: any; items?: any[] }>(b: T) {
  return {
    ...b,
    computedPrice: Number(b.computedPrice),
    finalPrice: Number(b.finalPrice),
    items: b.items?.map((it: any) => ({
      ...it,
      quantity: Number(it.quantity),
      vegetable: it.vegetable ? { ...it.vegetable, price: Number(it.vegetable.price) } : undefined
    }))
  }
}
