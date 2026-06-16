import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { createRuntimeVegetable, isRuntimeD1Active } from '#modula/server/platform/runtimeDb'
import { syncImageUsageTable } from '#modula/server/utils/imageReferences'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ name: string; unit: 'KG' | 'PIECE'; price: number; active?: boolean; imageUrl?: string | null }>(event)

  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  }
  if (typeof body.price !== 'number' || body.price < 0) {
    throw createError({ statusCode: 400, statusMessage: 'Prix invalide' })
  }
  if (body.unit !== 'KG' && body.unit !== 'PIECE') {
    throw createError({ statusCode: 400, statusMessage: 'Unité invalide' })
  }

  try {
    if (isRuntimeD1Active()) {
      const created = await createRuntimeVegetable({
        name: body.name.trim(),
        unit: body.unit,
        price: body.price,
        active: body.active ?? true,
        imageUrl: body.imageUrl || null
      })
      await syncImageUsageTable()
      return created
        ? { ...created, price: Number(created.price), active: created.active === true || created.active === 1 }
        : null
    }

    const v = await prisma.vegetable.create({
      data: { name: body.name.trim(), unit: body.unit, price: body.price, active: body.active ?? true, imageUrl: body.imageUrl || null }
    })
    await syncImageUsageTable()
    return { ...v, price: Number(v.price) }
  } catch (e: any) {
    if (e.code === 'P2002' || String(e?.message || '').includes('UNIQUE constraint failed')) {
      throw createError({ statusCode: 400, statusMessage: 'Un légume avec ce nom existe déjà' })
    }
    throw e
  }
})
