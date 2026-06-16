import { requireAdmin } from '#modula/server/utils/requireAdmin'
import {
  getRuntimeVegetablesByIds,
  isRuntimeD1Active,
  listRuntimeBaskets,
  updateRuntimeBasket,
  updateRuntimeVegetable
} from '#modula/server/platform/runtimeDb'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const body = await readBody<{ name?: string; unit?: 'KG' | 'PIECE'; price?: number; active?: boolean; imageUrl?: string | null }>(event)
  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.unit !== undefined) data.unit = body.unit
  if (body.price !== undefined) data.price = body.price
  if (body.active !== undefined) data.active = body.active
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null

  try {
    if (isRuntimeD1Active()) {
      const updated = await updateRuntimeVegetable(id, data)
      if (!updated) {
        throw createError({ statusCode: 404, statusMessage: 'Légume introuvable' })
      }
      if (body.price !== undefined) {
        await recomputeRuntimeBasketsForVegetable(id)
      }
      await syncImageUsageTable()
      return { ...updated, price: Number(updated.price), active: updated.active === true || updated.active === 1 }
    }

    const v = await db.vegetable.update({ where: { id }, data })
    if (body.price !== undefined) {
      await recomputeBasketsForVegetable(id)
    }
    await syncImageUsageTable()
    return { ...v, price: Number(v.price) }
  } catch (e: any) {
    if (e.code === 'P2002') {
      throw createError({ statusCode: 400, statusMessage: 'Un légume avec ce nom existe déjà' })
    }
    throw e
  }
})

async function recomputeRuntimeBasketsForVegetable(vegetableId: number) {
  const baskets = await listRuntimeBaskets()
  const impacted = baskets.filter((basket) => basket.items?.some((item: any) => item.vegetableId === vegetableId))

  for (const basket of impacted) {
    const vegetableIds = (basket.items ?? []).map((item: any) => item.vegetableId)
    const vegetables = await getRuntimeVegetablesByIds(vegetableIds)
    const vegetableById = new Map(vegetables.map((vegetable) => [vegetable.id, vegetable]))
    const computed = (basket.items ?? []).reduce((sum: number, item: any) => {
      const vegetable = vegetableById.get(item.vegetableId)
      return vegetable ? sum + Number(vegetable.price) * Number(item.quantity) : sum
    }, 0)
    await updateRuntimeBasket(basket.id, { computedPrice: computed })
  }
}

async function recomputeBasketsForVegetable(vegetableId: number) {
  const baskets = await db.basket.findMany({
    where: { items: { some: { vegetableId } } },
    include: { items: { include: { vegetable: true } } }
  })
  for (const b of baskets) {
    const computed = b.items.reduce((sum, it) => sum + Number(it.vegetable.price) * Number(it.quantity), 0)
    await db.basket.update({ where: { id: b.id }, data: { computedPrice: computed } })
  }
}
