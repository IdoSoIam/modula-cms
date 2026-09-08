interface PricedProductOption {
  kind: 'SUPPLEMENT' | 'INSURANCE' | 'ACCESSORY'
  priceSource: 'CUSTOM' | 'LINKED_PRODUCT'
  price: number
  hourlyPrice?: number | null
  dailyPrice?: number | null
  linkedProduct?: {
    price: number
    rentalHourlyPrice?: number | null
    rentalDailyPrice?: number | null
  } | null
}

export function getProductOptionBasePrice(option: PricedProductOption) {
  if (option.kind === 'ACCESSORY' && option.priceSource === 'LINKED_PRODUCT') {
    return Math.max(0, finiteNumber(option.linkedProduct?.price))
  }
  return Math.max(0, finiteNumber(option.price))
}

export function getProductOptionTimeFactor(
  pricingMode: 'FIXED' | 'RENTAL_DURATION',
  rentalDurationUnits: number,
  _rentalPricingMode: 'HOURLY' | 'DAILY' | null,
) {
  if (pricingMode === 'RENTAL_DURATION') return Math.max(0, rentalDurationUnits)
  return 1
}

export function getProductOptionCalculatedUnitPrice(
  option: PricedProductOption,
  rentalDurationUnits: number,
  rentalPricingMode: 'HOURLY' | 'DAILY' | null,
) {
  if (rentalPricingMode && option.priceSource === 'LINKED_PRODUCT' && option.linkedProduct) {
    const linkedRate = rentalPricingMode === 'HOURLY'
      ? option.linkedProduct.rentalHourlyPrice
      : option.linkedProduct.rentalDailyPrice
    if (linkedRate != null) return Math.max(0, finiteNumber(linkedRate)) * Math.max(0, rentalDurationUnits)
  }
  if (rentalPricingMode && (option.hourlyPrice != null || option.dailyPrice != null)) {
    const rate = rentalPricingMode === 'HOURLY' ? option.hourlyPrice : option.dailyPrice
    return Math.max(0, finiteNumber(rate)) * Math.max(0, rentalDurationUnits)
  }
  return getProductOptionBasePrice(option)
}

export function getProductOptionChargedQuantity(
  quantityMode: 'PER_RESERVATION' | 'PER_PRODUCT_UNIT' | 'CUSTOM',
  productQuantity: number,
  selectedQuantity: number,
) {
  if (quantityMode === 'PER_PRODUCT_UNIT') return Math.max(1, integer(productQuantity, 1))
  if (quantityMode === 'CUSTOM') return Math.max(1, integer(selectedQuantity, 1))
  return 1
}

function finiteNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function integer(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}
