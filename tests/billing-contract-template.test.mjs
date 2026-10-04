import test from 'node:test'
import assert from 'node:assert/strict'
import { extractRentalContractClauses, getRentalContractContentTemplate } from '../shared/billingContractTemplate.ts'

test('rental contract templates expose customer, rental and payment fields', () => {
  for (const locale of ['fr', 'en']) {
    const template = getRentalContractContentTemplate(locale)
    for (const variable of [
      'customerName', 'customerEmail', 'customerPhone', 'customerAddress',
      'customerPostalCode', 'customerCity', 'customerCountry',
      'orderNumber', 'orderLines', 'rentalStartDate', 'rentalEndDate',
      'total', 'depositAmount',
    ]) {
      assert.ok(template.includes(`{{${variable}}}`), `${locale}: ${variable}`)
    }
  }
})

test('legacy contract content is not repeated in the dynamic PDF', () => {
  for (const locale of ['fr', 'en']) {
    const legacy = getRentalContractContentTemplate(locale)
    assert.equal(extractRentalContractClauses(legacy, locale), '')
    assert.equal(extractRentalContractClauses(`${legacy}\n\nExtra clause`, locale), 'Extra clause')
    assert.equal(extractRentalContractClauses('Custom clause', locale), 'Custom clause')
  }
})
