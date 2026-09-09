import { db } from '#modula/server/data/client'
import { hydrateProductBillingDocumentMetadata, resolveProductOptionGroups, serializeProduct } from '#modula/server/utils/shop'
import { getFeatureFlags } from '#modula/server/utils/settings'
import { isStripeConfiguredFromCache } from '#modula/server/services/payment/paymentService'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug produit requis'
    })
  }

  const numericId = /^\d+$/.test(slug) ? Number(slug) : null
  const row = await db.product.findUnique({
    where: numericId ? { id: numericId } : { slug },
    include: {
      category: true
    }
  })

  if (!row || row.deletedAt || !row.active || row.catalogVisible === false || Number(row.catalogVisible) === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Produit introuvable'
    })
  }
  const [featureFlags, onlinePaymentAvailable] = await Promise.all([
    getFeatureFlags(),
    isStripeConfiguredFromCache(),
  ])
  if (row.saleType === 'RENTAL' && !featureFlags.rentalsEnabled) {
    throw createError({ statusCode: 404, message: 'Produit introuvable' })
  }

  const resolvedProduct = await resolveProductOptionGroups({
    ...serializeProduct(row),
    allowOnlinePayment: onlinePaymentAvailable && Boolean(row.allowOnlinePayment),
    rentalDepositAllowOnlinePayment: onlinePaymentAvailable && Boolean(row.rentalDepositAllowOnlinePayment),
  })
  const product = await hydrateProductBillingDocumentMetadata(resolvedProduct)

  const relatedRows = await db.product.findMany({
    where: {
      active: true,
      catalogVisible: true,
      deletedAt: null,
    },
    include: {
      category: true
    },
    orderBy: [
      { position: 'asc' },
      { name: 'asc' }
    ]
  })

  const relatedProducts = relatedRows
    .map((entry: any) => ({
      ...serializeProduct(entry),
      allowOnlinePayment: onlinePaymentAvailable && Boolean(entry.allowOnlinePayment),
      rentalDepositAllowOnlinePayment: onlinePaymentAvailable && Boolean(entry.rentalDepositAllowOnlinePayment),
    }))
    .filter((entry: ReturnType<typeof serializeProduct>) =>
      entry.id !== product.id
      && (featureFlags.rentalsEnabled || entry.saleType !== 'RENTAL')
      && (
        (product.categoryId != null && entry.categoryId === product.categoryId)
        || entry.saleType === product.saleType
      ))
    .slice(0, 3)

  return {
    product,
    relatedProducts
  }
})
