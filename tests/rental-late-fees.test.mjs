import assert from 'node:assert/strict'
import test from 'node:test'

import { calculateRentalLateFee } from '../shared/rentalLateFees.ts'

const base = {
  scheduledReturnAt: '2026-09-15T10:00:00.000Z',
  actualReturnAt: '2026-09-15T10:01:00.000Z',
  mode: 'PER_HOUR_STARTED',
  configuredAmount: 12,
  quantity: 1,
  vatRate: 20,
}

test('a return inside the grace period has no fee', () => {
  assert.deepEqual(calculateRentalLateFee({ ...base, graceMinutes: 15 }), {
    lateMinutes: 0,
    billedUnits: 0,
    totalInclTax: 0,
    subtotalExclTax: 0,
    vatAmount: 0,
    vatRate: 20,
    baseRate: 12,
  })
})

test('started hours and quantity are billed with a TTC tax split', () => {
  assert.deepEqual(calculateRentalLateFee({
    ...base,
    actualReturnAt: '2026-09-15T11:01:00.000Z',
    quantity: 2,
  }), {
    lateMinutes: 61,
    billedUnits: 2,
    totalInclTax: 48,
    subtotalExclTax: 40,
    vatAmount: 8,
    vatRate: 20,
    baseRate: 12,
  })
})

test('daily multiplier uses the rental daily rate and clamps the result', () => {
  const result = calculateRentalLateFee({
    ...base,
    actualReturnAt: '2026-09-17T10:01:00.000Z',
    mode: 'DAILY_MULTIPLIER',
    configuredAmount: null,
    dailyRate: 100,
    multiplier: 1.5,
    minimumAmount: 50,
    maximumAmount: 400,
    vatRate: 25,
  })
  assert.equal(result.billedUnits, 3)
  assert.equal(result.totalInclTax, 400)
  assert.equal(result.subtotalExclTax, 320)
  assert.equal(result.vatAmount, 80)
})

test('fixed fees are applied once per rented unit', () => {
  const result = calculateRentalLateFee({ ...base, mode: 'FIXED', configuredAmount: 25, quantity: 3 })
  assert.equal(result.billedUnits, 1)
  assert.equal(result.totalInclTax, 75)
})

test('invalid negative amounts are rejected', () => {
  assert.throws(() => calculateRentalLateFee({ ...base, configuredAmount: -1 }), RangeError)
})
