import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getProductOptionBasePrice,
  getProductOptionCalculatedUnitPrice,
  getProductOptionChargedQuantity,
  getProductOptionTimeFactor,
} from '../shared/productOptionPricing.ts'
import { normalizeProductOptionGroups } from '../shared/productOptions.ts'

const accessory = (overrides = {}) => ({
  kind: 'ACCESSORY',
  priceSource: 'LINKED_PRODUCT',
  price: 0,
  linkedProduct: { price: 12 },
  ...overrides,
})

test('an accessory uses its catalogue price when no contextual price is set', () => {
  assert.equal(getProductOptionBasePrice(accessory()), 12)
})

test('a boat-specific override can replace the accessory catalogue price', () => {
  assert.equal(getProductOptionBasePrice(accessory({ priceSource: 'CUSTOM', price: 18 })), 18)
  assert.equal(getProductOptionBasePrice(accessory({ priceSource: 'CUSTOM', price: 25 })), 25)
})

test('custom accessory quantity is independent from the rented boat quantity', () => {
  assert.equal(getProductOptionChargedQuantity('CUSTOM', 2, 3), 3)
  assert.equal(getProductOptionChargedQuantity('PER_PRODUCT_UNIT', 2, 1), 2)
})

test('hourly and daily options follow the selected rental duration', () => {
  const option = accessory({
    priceSource: 'CUSTOM',
    hourlyPrice: 4,
    dailyPrice: 25,
  })
  assert.equal(getProductOptionCalculatedUnitPrice(option, 3, 'HOURLY'), 12)
  assert.equal(getProductOptionCalculatedUnitPrice(option, 3, 'DAILY'), 75)
  assert.equal(getProductOptionTimeFactor('RENTAL_DURATION', 3, 'DAILY'), 3)
  assert.equal(getProductOptionTimeFactor('FIXED', 3, 'DAILY'), 1)
})

test('complete option normalization declares and clamps quantity values', () => {
  const [group] = normalizeProductOptionGroups([{
    id: 'accessories',
    options: [{
      id: 'buoy',
      kind: 'ACCESSORY',
      defaultQuantity: 5,
      minQuantity: 1,
      maxQuantity: 3,
    }],
  }])
  assert.equal(group.options[0].defaultQuantity, 3)
  assert.equal(group.options[0].minQuantity, 1)
  assert.equal(group.options[0].maxQuantity, 3)
})
