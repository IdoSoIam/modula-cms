import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getRentalDepositPaymentCapabilities,
  getRentalDepositRegistryOrderId,
  isRentalDepositPaymentModeAvailable,
} from '../shared/rentalDeposit.ts'

const deposit = (overrides = {}) => ({
  rentalDepositAmount: 500,
  rentalDepositAllowOnsitePayment: true,
  rentalDepositAllowOnlinePayment: false,
  ...overrides,
})

test('an on-site deposit remains independent from an online rental payment', () => {
  const capabilities = getRentalDepositPaymentCapabilities([deposit()], true)
  assert.equal(capabilities.allowOnsite, true)
  assert.equal(capabilities.allowOnline, false)
  assert.equal(capabilities.defaultMode, 'ONSITE')
})

test('online and on-site deposit modes can both be offered to the customer', () => {
  const capabilities = getRentalDepositPaymentCapabilities([
    deposit({ rentalDepositAllowOnlinePayment: true }),
  ], true)
  assert.equal(capabilities.requiresChoice, true)
  assert.equal(isRentalDepositPaymentModeAvailable('ONSITE', capabilities), true)
  assert.equal(isRentalDepositPaymentModeAvailable('ONLINE', capabilities), true)
})

test('online deposit is disabled when no payment provider is available', () => {
  const capabilities = getRentalDepositPaymentCapabilities([
    deposit({ rentalDepositAllowOnsitePayment: false, rentalDepositAllowOnlinePayment: true }),
  ], false)
  assert.equal(capabilities.allowOnline, false)
  assert.equal(isRentalDepositPaymentModeAvailable('ONLINE', capabilities), false)
})

test('deposit-only checkout uses a registry key distinct from the order payment', () => {
  assert.equal(getRentalDepositRegistryOrderId(42), '42:deposit')
})
