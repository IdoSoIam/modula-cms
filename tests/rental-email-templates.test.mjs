import assert from 'node:assert/strict'
import test from 'node:test'

import {
  rentalEmailTemplateDefaults,
  rentalEmailTemplateDefinitions,
} from '../server/services/shop/rentalEmailTemplates.ts'

const appointmentVariables = ['fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation']

test('rental templates expose pickup appointment variables to the email editor', () => {
  for (const definition of rentalEmailTemplateDefinitions) {
    for (const variable of appointmentVariables) {
      assert.ok(definition.variables.includes(variable), `${definition.action} misses ${variable}`)
    }
  }
})

test('operational rental emails remind customers of the pickup appointment', () => {
  const operationalActions = [
    'rental_request_created',
    'rental_payment_confirmed',
    'rental_confirmed',
    'rental_in_preparation',
    'rental_ready',
  ]

  for (const action of operationalActions) {
    for (const locale of ['fr', 'en']) {
      const body = rentalEmailTemplateDefaults[action][locale].body
      for (const variable of appointmentVariables) {
        assert.match(body, new RegExp(`{{${variable}}}`), `${action}/${locale} misses ${variable}`)
      }
      assert.match(body, /{{rentalEndDate}}/, `${action}/${locale} misses rentalEndDate`)
    }
  }
})

test('rental start email reminds customers of return time and address', () => {
  for (const locale of ['fr', 'en']) {
    const body = rentalEmailTemplateDefaults.rental_started[locale].body
    assert.match(body, /{{rentalEndDate}}/)
    assert.match(body, /{{fulfillmentLocation}}/)
  }
})
