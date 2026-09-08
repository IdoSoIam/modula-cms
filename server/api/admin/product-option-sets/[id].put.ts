import { db } from '#modula/server/data/client'
import { serializeProductOptionSet } from '#modula/server/utils/shop'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { normalizeProductOptionGroups } from '#modula/shared/productOptions'

interface Body {
  name?: string
  categoryIds?: number[]
  productIds?: number[]
  saleTypes?: Array<'SALE' | 'RENTAL'>
  optionGroups?: unknown
  active?: boolean
  position?: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, message: 'ID invalide' })
  const body = await readBody<Body>(event)
  const existing = await db.productOptionSet.findUnique({ where: { id } })
  if (!existing) throw createError({ statusCode: 404, message: 'Ensemble d’options introuvable' })

  const data: Record<string, unknown> = {}
  if (body.name !== undefined) {
    const name = String(body.name || '').trim()
    if (!name) throw createError({ statusCode: 400, message: 'Nom requis' })
    data.name = name
  }
  if (body.categoryIds !== undefined) data.categoryIdsJson = JSON.stringify(normalizeIds(body.categoryIds))
  if (body.productIds !== undefined) data.productIdsJson = JSON.stringify(normalizeIds(body.productIds))
  if (body.saleTypes !== undefined) data.saleTypesJson = JSON.stringify(normalizeSaleTypes(body.saleTypes))
  if (body.optionGroups !== undefined) data.optionGroupsJson = JSON.stringify(normalizeProductOptionGroups(body.optionGroups))
  if (body.active !== undefined) data.active = Boolean(body.active)
  if (body.position !== undefined) data.position = normalizePosition(body.position)

  return serializeProductOptionSet(await db.productOptionSet.update({ where: { id }, data }))
})

function normalizeIds(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map(Number).filter(entry => Number.isInteger(entry) && entry > 0)))
    : []
}

function normalizeSaleTypes(value: unknown): Array<'SALE' | 'RENTAL'> {
  if (!Array.isArray(value)) return ['SALE', 'RENTAL']
  const values = Array.from(new Set(value.filter(entry => entry === 'SALE' || entry === 'RENTAL'))) as Array<'SALE' | 'RENTAL'>
  return values.length ? values : ['SALE', 'RENTAL']
}

function normalizePosition(value: unknown) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : 0
}
