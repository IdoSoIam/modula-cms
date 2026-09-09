import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeRentalRates, resolveRentalRatePrice } from '../shared/rentalRates.ts'

const rates = normalizeRentalRates([
  { pricingMode: 'HOURLY', duration: 60, price: 62 },
  { pricingMode: 'HOURLY', duration: 120, price: 102 },
  { pricingMode: 'DAILY', duration: 2, price: 389 },
  { pricingMode: 'DAILY', duration: 3, price: 570 },
])

test('duration grids resolve exact hourly and daily prices', () => {
  assert.equal(resolveRentalRatePrice(rates, 'HOURLY', 1), 62)
  assert.equal(resolveRentalRatePrice(rates, 'HOURLY', 2), 102)
  assert.equal(resolveRentalRatePrice(rates, 'DAILY', 2), 389)
  assert.equal(resolveRentalRatePrice(rates, 'DAILY', 3), 570)
})

test('an unsupported duration has no implicit approximate price', () => {
  assert.equal(resolveRentalRatePrice(rates, 'HOURLY', 1.5), null)
  assert.equal(resolveRentalRatePrice(rates, 'DAILY', 4), null)
})

test('invalid and duplicate rows are normalized safely', () => {
  assert.deepEqual(normalizeRentalRates([
    { pricingMode: 'HOURLY', duration: 60, price: 50 },
    { pricingMode: 'HOURLY', duration: 60, price: 55 },
    { pricingMode: 'DAILY', duration: 0, price: 100 },
    { pricingMode: 'UNKNOWN', duration: 1, price: 100 },
  ]), [{ pricingMode: 'HOURLY', duration: 60, price: 55 }])
})
