export interface ShopCartItem {
  key: string
  kind: 'product' | 'productLot'
  productId: number | null
  productLotId: number | null
  title: string
  imageUrl?: string | null
  description?: string | null
  quantity: number
  availableQuantity: number | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  unitPrice: number
  totalPrice: number
}

const STORAGE_KEY = 'modula-shop-cart-v1'

export interface ShopCartPaymentCapabilities {
  allowOffline: boolean
  allowOnline: boolean
  requiresChoice: boolean
  resolvedDefaultMode: 'offline' | 'stripe'
}

function clampQuantity(quantity: number, availableQuantity: number | null) {
  const normalized = Math.max(1, Math.round(Number(quantity || 1)))
  if (availableQuantity == null || availableQuantity < 0) return normalized
  return Math.max(1, Math.min(normalized, availableQuantity))
}

export function getShopCartPaymentCapabilities(items: ShopCartItem[], stripeEnabled: boolean): ShopCartPaymentCapabilities {
  const nonEmptyItems = items.filter((item) => item.quantity > 0)
  const allowOffline = nonEmptyItems.length > 0 && nonEmptyItems.every((item) => item.allowOfflinePayment)
  const allowOnline = stripeEnabled && nonEmptyItems.length > 0 && nonEmptyItems.every((item) => item.allowOnlinePayment)

  return {
    allowOffline,
    allowOnline,
    requiresChoice: allowOffline && allowOnline,
    resolvedDefaultMode: allowOnline && !allowOffline ? 'stripe' : 'offline'
  }
}

export function useShopCart() {
  const items = useState<ShopCartItem[]>('modula-shop-cart-items', () => [])
  const hydrated = useState<boolean>('modula-shop-cart-hydrated', () => false)

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        items.value = Array.isArray(parsed)
          ? parsed.map((item) => ({
              key: String(item?.key || ''),
              kind: item?.kind === 'productLot' ? 'productLot' : 'product',
              productId: item?.productId == null ? null : Number(item.productId),
              productLotId: item?.productLotId == null ? null : Number(item.productLotId),
              title: String(item?.title || ''),
              imageUrl: item?.imageUrl ?? null,
              description: item?.description ?? null,
              quantity: Math.max(1, Number(item?.quantity || 1)),
              availableQuantity: item?.availableQuantity == null ? null : Number(item.availableQuantity),
              allowOfflinePayment: item?.allowOfflinePayment !== false,
              allowOnlinePayment: item?.allowOnlinePayment === true,
              unitPrice: Number(item?.unitPrice || 0),
              totalPrice: Number(item?.totalPrice || 0)
            }))
          : []
      }
    } catch {
      items.value = []
    } finally {
      hydrated.value = true
    }
  }

  onMounted(hydrate)

  watch(items, (value) => {
    if (!import.meta.client || !hydrated.value) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  }, { deep: true })

  const count = computed(() => items.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0))
  const total = computed(() => items.value.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0))

  const add = (item: ShopCartItem) => {
    const existing = items.value.find((entry) => entry.key === item.key)
    const requestedQuantity = clampQuantity(item.quantity, item.availableQuantity)
    if (existing) {
      existing.title = item.title
      existing.imageUrl = item.imageUrl ?? null
      existing.description = item.description ?? null
      existing.availableQuantity = item.availableQuantity
      existing.allowOfflinePayment = item.allowOfflinePayment
      existing.allowOnlinePayment = item.allowOnlinePayment
      existing.quantity = clampQuantity(existing.quantity + requestedQuantity, existing.availableQuantity)
      existing.totalPrice = existing.unitPrice * existing.quantity
      return
    }
    items.value.push({
      ...item,
      quantity: requestedQuantity,
      totalPrice: item.unitPrice * requestedQuantity
    })
  }

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      remove(key)
      return
    }
    const entry = items.value.find((item) => item.key === key)
    if (!entry) return
    entry.quantity = clampQuantity(quantity, entry.availableQuantity)
    entry.totalPrice = entry.unitPrice * entry.quantity
  }

  const remove = (key: string) => {
    items.value = items.value.filter((item) => item.key !== key)
  }

  const clear = () => {
    items.value = []
  }

  return {
    items,
    count,
    total,
    hydrate,
    add,
    updateQuantity,
    remove,
    clear
  }
}
