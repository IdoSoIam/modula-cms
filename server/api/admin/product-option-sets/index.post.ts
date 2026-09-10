import { db } from '#modula/server/data/client'
import { serializeProductOptionSet } from '#modula/server/utils/shop'
import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { normalizeProductOptionGroups } from '#modula/shared/productOptions'
import { validateProductOptionSetLinks } from '#modula/server/utils/productOptionSets'

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
  const body = await readBody<Body>(event)
  const name = String(body.name || '').trim()
  if (!name) throw createError({ statusCode: 400, message: 'Nom requis' })

  const categoryIds = normalizeIds(body.categoryIds)
  const productIds = normalizeIds(body.productIds)
  const optionGroups = normalizeProductOptionGroups(body.optionGroups)
  await validateProductOptionSetLinks({ categoryIds, productIds, optionGroups })

  const row = await db.productOptionSet.create({
    data: {
      name,
      categoryIdsJson: JSON.stringify(categoryIds),
      productIdsJson: JSON.stringify(productIds),
      saleTypesJson: JSON.stringify(normalizeSaleTypes(body.saleTypes)),
      optionGroupsJson: JSON.stringify(optionGroups),
      active: body.active !== false,
      position: normalizePosition(body.position),
    },
  })
  return serializeProductOptionSet(row)
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
