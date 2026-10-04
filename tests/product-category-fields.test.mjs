import test from 'node:test'
import assert from 'node:assert/strict'
import { getRentalPartyCapacity, normalizeProductCategoryFields } from '../shared/productCategoryFields.ts'

test('category fields normalize reusable capacity definitions', () => {
  const fields = normalizeProductCategoryFields(JSON.stringify([
    { key: 'Capacity', label: 'Capacité maximale', type: 'NUMBER', required: true, purpose: 'RENTAL_PARTY_CAPACITY' },
    { key: 'Capacity', label: 'Duplicate', type: 'TEXT' },
  ]))
  assert.equal(fields.length, 1)
  assert.equal(fields[0].key, 'capacity')
  assert.equal(fields[0].labelLocalized.fr, 'Capacité maximale')
  assert.equal(fields[0].purpose, 'RENTAL_PARTY_CAPACITY')
})

test('rental capacity reads both legacy and generated product fields', () => {
  const category = { fields: normalizeProductCategoryFields([{ key: 'capacity', label: 'Places', type: 'NUMBER', purpose: 'RENTAL_PARTY_CAPACITY' }]) }
  assert.equal(getRentalPartyCapacity({ category, detailSections: [{ items: [{ id: 'capacity', value: '5 personnes' }] }] }), 5)
  assert.equal(getRentalPartyCapacity({ category, detailSections: [{ items: [{ id: 'category-field:capacity', value: '8' }] }] }), 8)
  assert.equal(getRentalPartyCapacity({ category, detailSections: [{ items: [{ id: 'category-field:capacity', value: '' }] }] }), null)
})
