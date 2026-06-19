import { db } from '#modula/server/data/client'
import { createStripeCheckoutSession, isStripeConfigured } from '#modula/server/services/payment/paymentService'
import { createOrderNumber, serializeProduct, serializeProductLot, serializeShopOrder } from '#modula/server/utils/shop'

interface OrderLineInput {
  kind: 'product' | 'productLot'
  productId?: number
  productLotId?: number
  quantity?: number
}

interface OrderBody {
  customerName: string
  email: string
  phone?: string | null
  message?: string | null
  paymentMode?: 'offline' | 'stripe'
  lines?: OrderLineInput[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<OrderBody>(event)

  if (!body.customerName?.trim() || !body.email?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Informations client incomplètes' })
  }

  const lines = Array.isArray(body.lines) ? body.lines : []
  if (!lines.length) {
    throw createError({ statusCode: 400, statusMessage: 'Panier vide' })
  }

  const productIds = Array.from(new Set(lines.filter((line) => line.kind === 'product' && Number(line.productId) > 0).map((line) => Number(line.productId))))
  const productLotIds = Array.from(new Set(lines.filter((line) => line.kind === 'productLot' && Number(line.productLotId) > 0).map((line) => Number(line.productLotId))))

  const [directProducts, productLots] = await Promise.all([
    productIds.length ? db.product.findMany({ where: { id: { in: productIds }, active: true } }) : [],
    productLotIds.length ? db.productLot.findMany({ where: { id: { in: productLotIds }, active: true }, include: { items: { include: { product: true } } } }) : []
  ])

  const productMapSource = new Map<number, ReturnType<typeof serializeProduct>>()
  for (const row of directProducts) {
    const serialized = serializeProduct(row)
    productMapSource.set(serialized.id, serialized)
  }
  for (const lotRow of productLots) {
    for (const item of lotRow.items || []) {
      if (item?.product) {
        const serialized = serializeProduct(item.product)
        productMapSource.set(serialized.id, serialized)
      }
    }
  }

  const productById = productMapSource
  const lotById = new Map(productLots.map((row: any) => [Number(row.id), serializeProductLot(row)]))

  const normalizedLines = lines.map((line) => {
    const quantity = Math.max(1, Math.round(Number(line.quantity || 1)))
    if (line.kind === 'product') {
      const product = productById.get(Number(line.productId))
      if (!product) {
        throw createError({ statusCode: 400, statusMessage: 'Produit introuvable dans le panier' })
      }
      return {
        kind: 'product' as const,
        quantity,
        title: product.name,
        productId: product.id,
        productLotId: null,
        unitPrice: product.price,
        totalPrice: product.price * quantity,
        stock: product.stock,
        allowOfflinePayment: product.allowOfflinePayment,
        allowOnlinePayment: product.allowOnlinePayment,
        imageUrl: product.imageUrl,
        description: product.excerpt || product.description || undefined,
        metaJson: JSON.stringify({ slug: product.slug, unitLabel: product.unitLabel })
      }
    }

    const productLot = lotById.get(Number(line.productLotId))
    if (!productLot) {
      throw createError({ statusCode: 400, statusMessage: 'Lot introuvable dans le panier' })
    }
    if (productLot.stock >= 0 && productLot.stock < quantity) {
      throw createError({ statusCode: 400, statusMessage: `Stock insuffisant pour ${productLot.name}` })
    }
    return {
      kind: 'productLot' as const,
      quantity,
      title: productLot.name,
      productId: null,
      productLotId: productLot.id,
      unitPrice: productLot.price,
      totalPrice: productLot.price * quantity,
      stock: productLot.stock,
      allowOfflinePayment: productLot.allowOfflinePayment,
      allowOnlinePayment: productLot.allowOnlinePayment,
      imageUrl: productLot.imageUrl,
      description: productLot.description || undefined,
      metaJson: JSON.stringify({
        slug: productLot.slug,
        kind: productLot.kind,
        items: productLot.items.map((item) => ({
          productId: item.productId,
          productName: item.product?.name || '',
          quantity: item.quantity
        }))
      })
    }
  })

  const paymentMode = body.paymentMode === 'stripe' ? 'stripe' : 'offline'
  const allowOffline = normalizedLines.every((line) => line.allowOfflinePayment)
  const allowOnline = isStripeConfigured() && normalizedLines.every((line) => line.allowOnlinePayment)

  if (!allowOffline && !allowOnline) {
    throw createError({ statusCode: 400, statusMessage: 'Aucun mode de paiement compatible pour ce panier' })
  }
  if (paymentMode === 'stripe' && !allowOnline) {
    throw createError({ statusCode: 400, statusMessage: 'Le paiement en ligne n’est pas disponible pour ce panier' })
  }
  if (paymentMode === 'offline' && !allowOffline) {
    throw createError({ statusCode: 400, statusMessage: 'Le paiement sur place n’est pas disponible pour ce panier' })
  }

  const requiredStocks = new Map<number, number>()
  for (const line of normalizedLines) {
    if (line.productId) {
      requiredStocks.set(line.productId, (requiredStocks.get(line.productId) || 0) + line.quantity)
      continue
    }

    if (line.productLotId) {
      const lot = lotById.get(line.productLotId)
      if (!lot) continue
      if (lot.stock < line.quantity) {
        throw createError({ statusCode: 400, statusMessage: `Stock insuffisant pour ${lot.name}` })
      }
      for (const item of lot.items) {
        requiredStocks.set(
          item.productId,
          (requiredStocks.get(item.productId) || 0) + Math.ceil(line.quantity * item.quantity)
        )
      }
    }
  }

  for (const [productId, requiredQuantity] of requiredStocks.entries()) {
    const product = productById.get(productId)
    if (!product || product.stock < requiredQuantity) {
      throw createError({ statusCode: 400, statusMessage: `Stock insuffisant pour ${product?.name || `#${productId}`}` })
    }
  }

  const subtotal = normalizedLines.reduce((sum, line) => sum + line.totalPrice, 0)
  const useStripe = paymentMode === 'stripe' && allowOnline

  const order = await db.shopOrder.create({
    data: {
      orderNumber: `TMP-${Date.now()}`,
      status: 'PENDING',
      paymentProvider: useStripe ? 'STRIPE' : 'OFFLINE',
      paymentStatus: useStripe ? 'PENDING' : 'UNPAID',
      customerName: body.customerName.trim(),
      email: body.email.trim(),
      phone: body.phone?.trim() || null,
      message: body.message?.trim() || null,
      currency: 'eur',
      subtotal,
      total: subtotal
    }
  })

  const orderNumber = createOrderNumber(Number(order.id))
  await db.shopOrder.update({
    where: { id: order.id },
    data: { orderNumber }
  })

  await db.shopOrderLine.createMany({
    data: normalizedLines.map((line) => ({
      orderId: order.id,
      productLotId: line.productLotId,
      productId: line.productId,
      title: line.title,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
      metaJson: line.metaJson
    }))
  })

  for (const [productId, requiredQuantity] of requiredStocks.entries()) {
    const source = productById.get(productId)
    if (!source) continue
    await db.product.update({
      where: { id: productId },
      data: {
        stock: Math.max(0, source.stock - requiredQuantity)
      }
    })
    source.stock = Math.max(0, source.stock - requiredQuantity)
  }

  let checkoutUrl: string | null = null
  let stripeSessionId: string | null = null

  if (useStripe) {
    const requestUrl = getRequestURL(event)
    const successUrl = `${requestUrl.origin}${requestUrl.pathname}?checkout=success&order=${order.id}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${requestUrl.origin}${requestUrl.pathname}?checkout=cancel&order=${order.id}`
    const session = await createStripeCheckoutSession({
      successUrl,
      cancelUrl,
      customerEmail: body.email.trim(),
      metadata: {
        orderId: String(order.id),
        orderNumber
      },
      lineItems: normalizedLines.map((line) => ({
        name: line.title,
        amount: Math.round(line.unitPrice * 100),
        quantity: line.quantity,
        currency: 'eur',
        description: line.description,
        imageUrl: line.imageUrl || undefined
      }))
    })
    checkoutUrl = session.url
    stripeSessionId = session.id
    await db.shopOrder.update({
      where: { id: order.id },
      data: {
        checkoutUrl,
        stripeCheckoutSessionId: stripeSessionId
      }
    })
  }

  const fullOrder = await db.shopOrder.findUnique({
    where: { id: order.id },
    include: { lines: true }
  })

  return {
    ok: true,
    redirectUrl: checkoutUrl,
    order: serializeShopOrder(fullOrder)
  }
})
