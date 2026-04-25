import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<{ name?: string; unit?: 'KG' | 'PIECE'; price?: number; active?: boolean }>(event)
  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.unit !== undefined) data.unit = body.unit
  if (body.price !== undefined) data.price = body.price
  if (body.active !== undefined) data.active = body.active

  try {
    const v = await prisma.vegetable.update({ where: { id }, data })
    if (body.price !== undefined) {
      await recomputeBasketsForVegetable(id)
    }
    return { ...v, price: Number(v.price) }
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw createError({ statusCode: 400, statusMessage: 'Un légume avec ce nom existe déjà' })
    }
    throw e
  }
})

async function recomputeBasketsForVegetable(vegetableId: number) {
  const baskets = await prisma.basket.findMany({
    where: { items: { some: { vegetableId } } },
    include: { items: { include: { vegetable: true } } }
  })
  for (const b of baskets) {
    const computed = b.items.reduce((sum, it) => sum + Number(it.vegetable.price) * Number(it.quantity), 0)
    await prisma.basket.update({ where: { id: b.id }, data: { computedPrice: computed } })
  }
}
