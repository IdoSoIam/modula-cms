import { db } from '#modula/server/data/client'
import type { ProductOptionGroup } from '#modula/shared/productOptions'
import { normalizeRentalRates } from '#modula/shared/rentalRates'

export async function validateProductOptionSetLinks(input: {
  categoryIds: number[]
  productIds: number[]
  optionGroups: ProductOptionGroup[]
}) {
  const linkedOptions = input.optionGroups
    .flatMap(group => group.options)
    .filter(option => option.kind === 'ACCESSORY' && option.linkedProductId)
  if (!linkedOptions.length) return

  const targetProducts = input.productIds.length
    ? await db.product.findMany({ where: { id: { in: input.productIds } }, select: { categoryId: true } })
    : []
  const excludedCategoryIds = new Set([
    ...input.categoryIds,
    ...targetProducts.map((product: any) => Number(product.categoryId || 0)).filter(Boolean),
  ])
  const linkedIds = Array.from(new Set(linkedOptions.map(option => Number(option.linkedProductId))))
  const linkedProducts = await db.product.findMany({ where: { id: { in: linkedIds }, deletedAt: null } })
  const linkedById = new Map(linkedProducts.map((product: any) => [Number(product.id), product]))

  for (const option of linkedOptions) {
    const linked = linkedById.get(Number(option.linkedProductId)) as any
    if (!linked) throw createError({ statusCode: 400, message: `Le produit lié à l’option « ${option.label || option.id} » est introuvable` })
    if (linked.categoryId && excludedCategoryIds.has(Number(linked.categoryId))) {
      throw createError({
        statusCode: 400,
        message: `L’option « ${option.label || option.id} » doit utiliser un produit d’une autre catégorie que les produits cibles`,
      })
    }
    if (option.rentalPeriodMode !== 'FIXED_DURATION') continue
    if (linked.saleType !== 'RENTAL') {
      throw createError({ statusCode: 400, message: `La durée propre à « ${option.label || option.id} » nécessite un produit lié de type location` })
    }
    const allowedDurations = new Set(normalizeRentalRates(linked.rentalRatesJson)
      .filter(rate => rate.pricingMode === 'HOURLY')
      .map(rate => rate.duration))
    if (!option.rentalDurationMinutes.length || option.rentalDurationMinutes.some(duration => !allowedDurations.has(duration))) {
      throw createError({
        statusCode: 400,
        message: `Les forfaits de « ${option.label || option.id} » doivent correspondre à la grille tarifaire horaire du produit lié`,
      })
    }
  }
}
