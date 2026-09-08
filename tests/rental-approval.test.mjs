import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseRentalApprovalLineMeta,
  requiresManualRentalApproval,
  resolveRentalOrderStatus,
} from '../server/services/shop/rentalApproval.ts'

test('rentals remain pending until an administrator confirms them', () => {
  assert.equal(resolveRentalOrderStatus({ hasRental: true, useStripe: false, requiresManualApproval: false }), 'PENDING')
  assert.equal(resolveRentalOrderStatus({ hasRental: true, useStripe: true, requiresManualApproval: false }), 'PENDING')
})

test('manual rentals remain pending for online and on-site payments', () => {
  assert.equal(resolveRentalOrderStatus({ hasRental: true, useStripe: false, requiresManualApproval: true }), 'PENDING')
  assert.equal(resolveRentalOrderStatus({ hasRental: true, useStripe: true, requiresManualApproval: true }), 'PENDING')
})

test('one manual rental line makes the full order require approval', () => {
  const lines = [
    { saleType: 'RENTAL', rentalApprovalMode: 'AUTO' },
    parseRentalApprovalLineMeta('{"saleType":"RENTAL","rentalApprovalMode":"MANUAL"}'),
  ].filter(Boolean)
  assert.equal(requiresManualRentalApproval(lines), true)
})
