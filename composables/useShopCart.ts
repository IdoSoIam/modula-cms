export interface ShopCartItem {
  key: string
  kind: 'product'
  saleType: 'SALE' | 'RENTAL'
  productId: number | null
  slug?: string | null
  title: string
  imageUrl?: string | null
  description?: string | null
  quantity: number
  rentalStartDate?: string | null
  rentalEndDate?: string | null
  rentalPricingMode?: 'HOURLY' | 'DAILY' | null
  rentalBaseUnitPrice?: number | null
  insuranceSelections?: ShopCartInsuranceSelection[]
  optionSelections?: ShopCartOptionSelection[]
  associatedDocuments?: ShopCartAssociatedDocument[]
  availableQuantity: number | null
  vatRate: number
  paymentTaxCode?: string | null
  paymentTaxBehavior?: 'inclusive' | 'exclusive' | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  rentalDepositAmount?: number | null
  rentalDepositAllowOnsitePayment?: boolean
  rentalDepositAllowOnlinePayment?: boolean
  unitPrice: number
  totalPrice: number
}

export interface ShopCartInsuranceSelection {
  documentId: number
  name: string
  required: boolean
  unitPrice: number
}

export interface ShopCartOptionSelection {
  optionId: string
  label: string
  kind: 'SUPPLEMENT' | 'INSURANCE' | 'ACCESSORY'
  quantityMode: 'PER_RESERVATION' | 'PER_PRODUCT_UNIT' | 'CUSTOM'
  selectedQuantity: number
  quantity: number
  unitPrice: number
  totalPrice: number
  billingDocumentId?: number | null
  linkedProductId?: number | null
}

export interface ShopCartAssociatedDocument {
  key: string
  name: string
  kind: 'pdf' | 'billingDocument'
  url: string
  documentId?: number | null
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
          ? parsed.map<ShopCartItem>((item) => ({
              key: String(item?.key || ''),
              kind: 'product',
              saleType: item?.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
              productId: item?.productId == null ? null : Number(item.productId),
              slug: item?.slug?.trim() || null,
              title: String(item?.title || ''),
              imageUrl: item?.imageUrl ?? null,
              description: item?.description ?? null,
              quantity: Math.max(1, Number(item?.quantity || 1)),
              rentalStartDate: item?.rentalStartDate?.trim() || null,
              rentalEndDate: item?.rentalEndDate?.trim() || null,
              rentalPricingMode: item?.rentalPricingMode === 'HOURLY' ? 'HOURLY' : item?.rentalPricingMode === 'DAILY' ? 'DAILY' : null,
              rentalBaseUnitPrice: item?.rentalBaseUnitPrice == null ? null : Number(item.rentalBaseUnitPrice),
              insuranceSelections: Array.isArray(item?.insuranceSelections)
                ? item.insuranceSelections
                    .map((insurance: any) => ({
                      documentId: Number(insurance?.documentId || 0),
                      name: String(insurance?.name || ''),
                      required: Boolean(insurance?.required),
                      unitPrice: Number(insurance?.unitPrice || 0),
                    }))
                    .filter((insurance: ShopCartInsuranceSelection) => insurance.documentId > 0)
                : [],
              optionSelections: normalizeCartOptionSelections(item?.optionSelections),
              associatedDocuments: Array.isArray(item?.associatedDocuments)
                ? item.associatedDocuments
                    .map((document: any) => ({
                      key: String(document?.key || ''),
                      name: String(document?.name || ''),
                      kind: document?.kind === 'billingDocument' ? 'billingDocument' as const : 'pdf' as const,
                      url: String(document?.url || ''),
                      documentId: document?.documentId == null ? null : Number(document.documentId),
                    }))
                    .filter((document: ShopCartAssociatedDocument) => document.key && document.url)
                : [],
              availableQuantity: item?.availableQuantity == null ? null : Number(item.availableQuantity),
              vatRate: Number(item?.vatRate || 0),
              paymentTaxCode: item?.paymentTaxCode ?? null,
              paymentTaxBehavior: item?.paymentTaxBehavior === 'exclusive' ? 'exclusive' : item?.paymentTaxBehavior === 'inclusive' ? 'inclusive' : null,
              allowOfflinePayment: item?.allowOfflinePayment !== false,
              allowOnlinePayment: item?.allowOnlinePayment === true,
              rentalDepositAmount: item?.saleType === 'RENTAL' && Number(item?.rentalDepositAmount || 0) > 0 ? Number(item.rentalDepositAmount) : null,
              rentalDepositAllowOnsitePayment: item?.rentalDepositAllowOnsitePayment !== false,
              rentalDepositAllowOnlinePayment: item?.rentalDepositAllowOnlinePayment === true,
              unitPrice: Number(item?.unitPrice || 0),
              totalPrice: Number(item?.totalPrice || 0)
            }))
            .filter((item) => item.productId != null && item.key)
            .map(refreshCartItemTotals)
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
      existing.slug = item.slug?.trim() || null
      existing.saleType = item.saleType
      existing.imageUrl = item.imageUrl ?? null
      existing.description = item.description ?? null
      existing.rentalStartDate = item.rentalStartDate?.trim() || null
      existing.rentalEndDate = item.rentalEndDate?.trim() || null
      existing.rentalPricingMode = item.rentalPricingMode ?? null
      existing.rentalBaseUnitPrice = item.rentalBaseUnitPrice ?? null
      existing.insuranceSelections = item.insuranceSelections ? item.insuranceSelections.map(entry => ({ ...entry })) : []
      existing.optionSelections = item.optionSelections ? item.optionSelections.map(entry => ({ ...entry })) : []
      existing.associatedDocuments = item.associatedDocuments ? item.associatedDocuments.map(entry => ({ ...entry })) : []
      existing.availableQuantity = item.availableQuantity
      existing.vatRate = item.vatRate
      existing.paymentTaxCode = item.paymentTaxCode ?? null
      existing.paymentTaxBehavior = item.paymentTaxBehavior ?? null
      existing.allowOfflinePayment = item.allowOfflinePayment
      existing.allowOnlinePayment = item.allowOnlinePayment
      existing.rentalDepositAmount = item.rentalDepositAmount ?? null
      existing.rentalDepositAllowOnsitePayment = item.rentalDepositAllowOnsitePayment !== false
      existing.rentalDepositAllowOnlinePayment = item.rentalDepositAllowOnlinePayment === true
      existing.quantity = clampQuantity(existing.quantity + requestedQuantity, existing.availableQuantity)
      refreshCartItemTotals(existing)
      return
    }
    items.value.push(refreshCartItemTotals({
      ...item,
      quantity: requestedQuantity,
    }))
  }

  const replace = (key: string, item: ShopCartItem) => {
    const index = items.value.findIndex((entry) => entry.key === key)
    if (index < 0) {
      add(item)
      return
    }
    items.value[index] = refreshCartItemTotals({
      ...item,
      key,
      slug: item.slug?.trim() || null,
      quantity: clampQuantity(item.quantity, item.availableQuantity),
      insuranceSelections: item.insuranceSelections?.map(entry => ({ ...entry })) || [],
      optionSelections: item.optionSelections?.map(entry => ({ ...entry })) || [],
      associatedDocuments: item.associatedDocuments?.map(entry => ({ ...entry })) || [],
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
    refreshCartItemTotals(entry)
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
    replace,
    updateQuantity,
    remove,
    clear
  }
}

function normalizeCartOptionSelections(value: unknown): ShopCartOptionSelection[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry: any) => ({
      optionId: String(entry?.optionId || ''),
      label: String(entry?.label || ''),
      kind: entry?.kind === 'ACCESSORY' ? 'ACCESSORY' as const : entry?.kind === 'INSURANCE' ? 'INSURANCE' as const : 'SUPPLEMENT' as const,
      quantityMode: entry?.quantityMode === 'PER_PRODUCT_UNIT'
        ? 'PER_PRODUCT_UNIT' as const
        : entry?.quantityMode === 'CUSTOM' ? 'CUSTOM' as const : 'PER_RESERVATION' as const,
      selectedQuantity: Math.max(1, Math.round(Number(entry?.selectedQuantity ?? entry?.quantity ?? 1))),
      quantity: Math.max(1, Math.round(Number(entry?.quantity || 1))),
      unitPrice: Math.max(0, Number(entry?.unitPrice || 0)),
      totalPrice: Math.max(0, Number(entry?.totalPrice || 0)),
      billingDocumentId: entry?.billingDocumentId == null ? null : Number(entry.billingDocumentId),
      linkedProductId: entry?.linkedProductId == null ? null : Number(entry.linkedProductId),
    }))
    .filter(entry => entry.optionId)
}

function refreshCartItemTotals<T extends ShopCartItem>(item: T): T {
  for (const option of item.optionSelections || []) {
    option.quantity = option.quantityMode === 'PER_PRODUCT_UNIT'
      ? Math.max(1, item.quantity)
      : option.quantityMode === 'CUSTOM' ? Math.max(1, option.selectedQuantity) : 1
    option.totalPrice = Number(option.unitPrice || 0) * option.quantity
  }

  const optionsTotal = (item.optionSelections || []).reduce((sum, option) => sum + option.totalPrice, 0)
  item.totalPrice = Number(item.unitPrice || 0) * Number(item.quantity || 0) + optionsTotal
  return item
}
