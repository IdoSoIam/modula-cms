import assert from 'node:assert/strict'
import test from 'node:test'

import { getProductOptionCalculatedUnitPrice } from '../shared/productOptionPricing.ts'
import { normalizeProductOptionGroups } from '../shared/productOptions.ts'

const linkedAccessory = {
  kind: 'ACCESSORY',
  priceSource: 'LINKED_PRODUCT',
  price: 0,
  linkedProduct: {
    price: 15,
    rentalHourlyPrice: 5,
    rentalDailyPrice: 20,
    rentalPricingStrategy: 'GRID',
    rentalRates: [
      { pricingMode: 'HOURLY', duration: 240, price: 20 },
      { pricingMode: 'HOURLY', duration: 480, price: 30 },
    ],
  },
}

test('a fixed accessory duration uses the exact linked product price grid', () => {
  assert.equal(getProductOptionCalculatedUnitPrice(linkedAccessory, 3, 'DAILY', 240), 20)
  assert.equal(getProductOptionCalculatedUnitPrice(linkedAccessory, 3, 'DAILY', 480), 30)
})

test('a fixed accessory duration falls back to the hourly rate', () => {
  assert.equal(getProductOptionCalculatedUnitPrice(linkedAccessory, 1, 'DAILY', 120), 10)
})

test('legacy options keep the parent period and new duration choices are normalized', () => {
  const [legacyGroup] = normalizeProductOptionGroups([{ id: 'g1', options: [{ id: 'legacy', kind: 'ACCESSORY' }] }])
  assert.equal(legacyGroup.options[0].rentalPeriodMode, 'PARENT_PERIOD')
  assert.deepEqual(legacyGroup.options[0].rentalDurationMinutes, [])

  const [fixedGroup] = normalizeProductOptionGroups([{
    id: 'g2',
    options: [{
      id: 'fixed',
      kind: 'ACCESSORY',
      rentalPeriodMode: 'FIXED_DURATION',
      rentalDurationMinutes: [480, 240, 240, 0],
    }],
  }])
  assert.equal(fixedGroup.options[0].rentalPeriodMode, 'FIXED_DURATION')
  assert.deepEqual(fixedGroup.options[0].rentalDurationMinutes, [240, 480])
})
