import { db } from '#modula/server/data/client'
import { serializeProduct, serializeProductCategory } from '#modula/server/utils/shop'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = typeof query.category === 'string' ? query.category.trim() : ''
  const saleType = query.saleType === 'RENTAL' ? 'RENTAL' : query.saleType === 'SALE' ? 'SALE' : ''

  const categories = await db.productCategory.findMany({
    where: { active: true },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  const category = categorySlug
    ? categories.find((entry: any) => String(entry.slug) === categorySlug) || null
    : null

  const sharedWhere: Record<string, any> = { active: true }
  if (category) sharedWhere.categoryId = Number(category.id)
  if (saleType) sharedWhere.saleType = saleType

  const products = await db.product.findMany({
    where: sharedWhere,
    include: {
      category: true
    },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  return {
    categories: categories.map(serializeProductCategory),
    selectedCategorySlug: category?.slug || '',
    products: products.map(serializeProduct)
  }
})
