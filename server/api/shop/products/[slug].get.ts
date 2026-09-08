import { db } from '#modula/server/data/client'
import { hydrateProductBillingDocumentMetadata, serializeProduct } from '#modula/server/utils/shop'
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

  const row = await db.product.findUnique({
    where: { slug },
    include: {
      category: true
    }
  })

  if (!row || !row.active) {
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

  const product = await hydrateProductBillingDocumentMetadata({
    ...serializeProduct(row),
    allowOnlinePayment: onlinePaymentAvailable && Boolean(row.allowOnlinePayment),
  })

  const relatedRows = await db.product.findMany({
    where: {
      active: true
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
