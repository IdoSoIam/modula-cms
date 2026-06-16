import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { serializeBasket } from '#modula/server/utils/baskets'
import { db } from '#modula/server/data/client'

interface Body {
  name?: string
  description?: string | null
  imageUrl?: string | null
  available?: number
  active?: boolean
  finalPrice?: number
  position?: number
  items?: { vegetableId: number; quantity: number }[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const body = await readBody<Body>(event)

  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.description !== undefined) data.description = body.description
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl
  if (body.available !== undefined) data.available = body.available
  if (body.active !== undefined) data.active = body.active
  if (body.position !== undefined) data.position = body.position

  if (body.items) {
    const veggies = body.items.length
      ? await db.vegetable.findMany({ where: { id: { in: body.items.map(i => i.vegetableId) } } })
      : []
    const computed = body.items.reduce((sum, it) => {
      const v = veggies.find((x: any) => x.id === it.vegetableId)
      return v ? sum + Number(v.price) * it.quantity : sum
    }, 0)
    data.computedPrice = computed
    if (body.finalPrice === undefined) data.finalPrice = computed

    await db.basketItem.deleteMany({ where: { basketId: id } })
    await db.basketItem.createMany({
      data: body.items.map(it => ({ basketId: id, vegetableId: it.vegetableId, quantity: it.quantity }))
    })
  }

  if (body.finalPrice !== undefined) data.finalPrice = body.finalPrice

  const basket = await db.basket.update({
    where: { id },
    data,
    include: { items: { include: { vegetable: true } } }
  })
  await syncImageUsageTable()
  return serializeBasket(basket)
})
