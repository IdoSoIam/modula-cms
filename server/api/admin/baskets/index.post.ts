import { requireAdmin } from '~/server/utils/requireAdmin'
import { serializeBasket } from '~/server/utils/baskets'
import { prisma } from '../../../../prisma/client'

interface Body {
  name: string
  description?: string
  imageUrl?: string
  available?: number
  active?: boolean
  finalPrice?: number
  position?: number
  items?: { vegetableId: number; quantity: number }[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }

  const items = body.items ?? []
  const veggies = items.length
    ? await prisma.vegetable.findMany({ where: { id: { in: items.map(i => i.vegetableId) } } })
    : []
  const computed = items.reduce((sum, it) => {
    const v = veggies.find(x => x.id === it.vegetableId)
    return v ? sum + Number(v.price) * it.quantity : sum
  }, 0)

  const basket = await prisma.basket.create({
    data: {
      name: body.name.trim(),
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      available: body.available ?? 0,
      active: body.active ?? true,
      position: body.position ?? 0,
      computedPrice: computed,
      finalPrice: body.finalPrice ?? computed,
      items: { create: items.map(it => ({ vegetableId: it.vegetableId, quantity: it.quantity })) }
    },
    include: { items: { include: { vegetable: true } } }
  })
  return serializeBasket(basket)
})
