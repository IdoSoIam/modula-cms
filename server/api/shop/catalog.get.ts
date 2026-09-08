import { db } from '#modula/server/data/client'
import { serializeProduct, serializeProductCategory } from '#modula/server/utils/shop'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { isStripeConfiguredFromCache } from '#modula/server/services/payment/paymentService'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const categorySlug = typeof query.category === 'string' ? query.category.trim() : ''
  const categoryIds = typeof query.categoryIds === 'string'
    ? [...new Set(query.categoryIds.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0))]
    : []
  const saleType = query.saleType === 'RENTAL' ? 'RENTAL' : query.saleType === 'SALE' ? 'SALE' : ''
  const [featureFlags, onlinePaymentAvailable] = await Promise.all([
    getFeatureFlags(),
    isStripeConfiguredFromCache(),
  ])
  if (saleType === 'RENTAL' && !featureFlags.rentalsEnabled) {
    return { categories: [], selectedCategorySlug: '', products: [] }
  }

  const categories = await db.productCategory.findMany({
    where: { active: true },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  const scopedCategories = categoryIds.length
    ? categories.filter((entry: any) => categoryIds.includes(Number(entry.id)))
    : categories
  const sharedWhere: Record<string, any> = { active: true }
  if (saleType) sharedWhere.saleType = saleType

  const productRows = await db.product.findMany({
    where: sharedWhere,
    include: {
      category: true
    },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })
  const enabledProducts = featureFlags.rentalsEnabled
    ? productRows
    : productRows.filter((product: any) => product.saleType !== 'RENTAL')
  const scopedProducts = categoryIds.length
    ? enabledProducts.filter((product: any) => categoryIds.includes(Number(product.categoryId)))
    : enabledProducts
  const visibleCategoryIds = new Set(scopedProducts.map((product: any) => Number(product.categoryId)).filter(Boolean))
  const visibleCategories = scopedCategories.filter((entry: any) => visibleCategoryIds.has(Number(entry.id)))
  const category = categorySlug
    ? visibleCategories.find((entry: any) => String(entry.slug) === categorySlug) || null
    : null
  const products = category
    ? scopedProducts.filter((product: any) => Number(product.categoryId) === Number(category.id))
    : scopedProducts

  return {
    categories: visibleCategories.map(serializeProductCategory),
    selectedCategorySlug: category?.slug || '',
    products: products.map((row: any) => ({
      ...serializeProduct(row),
      allowOnlinePayment: onlinePaymentAvailable && Boolean(row.allowOnlinePayment),
    }))
  }
})
