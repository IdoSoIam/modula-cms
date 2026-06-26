import { db } from '#modula/server/data/client'
import { serializeProduct } from '#modula/server/utils/shop'

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

  const product = serializeProduct(row)

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
    .map(serializeProduct)
    .filter((entry) =>
      entry.id !== product.id
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
