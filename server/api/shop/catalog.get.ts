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
  const requestedPage = positiveInteger(query.page, 1)
  const pageSize = Math.min(48, positiveInteger(query.pageSize, 12))
  const categoryLinkTargets = parseCategoryLinkTargets(query.categoryLinks)
  const [featureFlags, onlinePaymentAvailable] = await Promise.all([
    getFeatureFlags(),
    isStripeConfiguredFromCache(),
  ])
  if (saleType === 'RENTAL' && !featureFlags.rentalsEnabled) {
    return { categories: [], categoryLinks: [], selectedCategorySlug: '', products: [], pagination: { page: 1, pageSize, total: 0, totalPages: 1 } }
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
  const sharedWhere: Record<string, any> = { active: true, catalogVisible: true, deletedAt: null }
  if (saleType) sharedWhere.saleType = saleType
  if (categoryIds.length) sharedWhere.categoryId = { in: categoryIds }
  if (!featureFlags.rentalsEnabled && !saleType) sharedWhere.saleType = 'SALE'

  const categoryRows = await db.product.findMany({ where: sharedWhere, select: { categoryId: true } })
  const visibleCategoryIds = new Set(categoryRows.map((product: any) => Number(product.categoryId)).filter(Boolean))
  const visibleCategories = scopedCategories.filter((entry: any) => visibleCategoryIds.has(Number(entry.id)))
  const category = categorySlug
    ? visibleCategories.find((entry: any) => String(entry.slug) === categorySlug) || null
    : null
  const productWhere = category ? { ...sharedWhere, categoryId: Number(category.id) } : sharedWhere
  const total = await db.product.count({ where: productWhere })
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const productRows = await db.product.findMany({
    where: productWhere,
    include: { category: true },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  })
  const categoryLinks = await resolveCategoryLinks(categoryLinkTargets, categories, featureFlags.rentalsEnabled)

  return {
    categories: visibleCategories.map(serializeProductCategory),
    categoryLinks,
    selectedCategorySlug: category?.slug || '',
    products: productRows.map((row: any) => ({
      ...serializeProduct(row),
      allowOnlinePayment: onlinePaymentAvailable && Boolean(row.allowOnlinePayment),
      rentalDepositAllowOnlinePayment: onlinePaymentAvailable && Boolean(row.rentalDepositAllowOnlinePayment),
    })),
    pagination: { page, pageSize, total, totalPages },
  }
})

function positiveInteger(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseCategoryLinkTargets(value: unknown) {
  if (typeof value !== 'string') return []
  const unique = new Map<string, { categoryId: number, pageId: number }>()
  for (const item of value.split(',')) {
    const [categoryValue, pageValue] = item.split(':')
    const categoryId = positiveInteger(categoryValue, 0)
    const pageId = positiveInteger(pageValue, 0)
    if (categoryId && pageId) unique.set(`${categoryId}:${pageId}`, { categoryId, pageId })
  }
  return Array.from(unique.values()).slice(0, 12)
}

async function resolveCategoryLinks(
  targets: Array<{ categoryId: number, pageId: number }>,
  categories: any[],
  rentalsEnabled: boolean,
) {
  if (!targets.length) return []
  const categoryMap = new Map(categories.map(category => [Number(category.id), category]))
  const pages = await db.cmsPage.findMany({
    where: { id: { in: targets.map(target => target.pageId) }, status: 'PUBLISHED' },
  })
  const pageMap = new Map<number, any>(pages.map((page: any) => [Number(page.id), page]))
  const products = await db.product.findMany({
    where: {
      categoryId: { in: targets.map(target => target.categoryId) },
      active: true,
      catalogVisible: true,
      deletedAt: null,
    },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })

  return targets.flatMap((target) => {
    const category = categoryMap.get(target.categoryId)
    const page = pageMap.get(target.pageId)
    const preview = products.find((product: any) => Number(product.categoryId) === target.categoryId && (rentalsEnabled || product.saleType !== 'RENTAL'))
    if (!category || !page) return []
    return [{
      category: serializeProductCategory(category),
      href: String(page.path || '/'),
      imageUrl: preview?.imageUrl || null,
    }]
  })
}
